import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function apiError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw apiError('Invalid activity', 400);
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || !type.trim()
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    throw apiError('Invalid activity', 400);
  }

  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    throw apiError('Invalid activity reference', 400);
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw apiError('Activity references a missing user or team', 404);
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw apiError('Invalid team', 400);
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (typeof name !== 'string' || !name.trim()) {
    throw apiError('Team name is required', 400);
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw apiError('Team mascot is required', 400);
  }
  if (!Array.isArray(members)) {
    throw apiError('Team members must be an array', 400);
  }

  const memberIds = members as unknown[];
  if (memberIds.some((memberId) => typeof memberId !== 'string' || !mongoose.isValidObjectId(memberId))) {
    throw apiError('Invalid team member reference', 400);
  }

  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== new Set(memberIds.map(String)).size) {
    throw apiError('Team references a missing member', 404);
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: [...new Set(memberIds.map((memberId) => memberId as string))],
  });

  await User.updateMany(
    { _id: { $in: team.members } },
    { $set: { team: team._id } },
  );

  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const activities = await Activity.find().lean();

  const pointsByTeam = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    pointsByTeam.set(teamId, (pointsByTeam.get(teamId) ?? 0) + activity.points);
  }

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw apiError('User not found', 404);
  }

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();

  const recentActivityTypes = new Set(recentActivities.map((activity) => activity.type.toLowerCase()));
  let focus = user.fitnessGoal;

  if (user.fitnessGoal === 'strength' || recentActivityTypes.has('strength')) {
    focus = 'strength';
  } else if (user.fitnessGoal === 'endurance' || recentActivityTypes.has('run')) {
    focus = 'endurance';
  }

  const matchingWorkout = await Workout.findOne({ focus }).lean();
  if (matchingWorkout) {
    return [{
      ...matchingWorkout,
      reason: `Recommended for ${user.fitnessGoal === focus ? 'your fitness goal' : 'your recent activity'}: ${focus}.`,
    }];
  }

  const fallbackWorkouts = await Workout.find().sort({ minutes: 1 }).lean();
  return fallbackWorkouts.map((workout) => ({
    ...workout,
    reason: `Recommended based on your ${user.fitnessGoal} goal and recent activity.`,
  }));
}

export { User };
