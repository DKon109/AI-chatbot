const BaseAgent = require('./BaseAgent');

/**
 * Motivation Agent - Increases adherence through reminders and rewards
 */
class MotivationAgent extends BaseAgent {
  constructor() {
    super(
      'MotivationAgent',
      'Increases adherence through reminders and rewards'
    );
    
    // Motivation strategies database
    this.motivationStrategies = {
      medication_adherence: {
        reminders: [
          'Time for your medication! Your health depends on consistency.',
          'Don\'t forget your medication - you\'re doing great!',
          'Medication reminder: Stay on track with your health goals.'
        ],
        rewards: [
          '7-day streak! You\'re building healthy habits.',
          'Perfect week! Your consistency is paying off.',
          '30-day milestone! You\'re a medication adherence champion!'
        ],
        motivational_messages: [
          'Every dose brings you closer to better health.',
          'Your future self will thank you for this consistency.',
          'You\'re taking control of your health - that\'s powerful!'
        ]
      },
      exercise: {
        reminders: [
          'Ready for your workout? Your body will thank you!',
          'Exercise time! Even 10 minutes makes a difference.',
          'Let\'s get moving! Your health goals are waiting.'
        ],
        rewards: [
          'Workout complete! You\'re stronger than yesterday.',
          'Weekly goal achieved! Your dedication is inspiring.',
          'Monthly milestone! You\'re building a healthier lifestyle.'
        ],
        motivational_messages: [
          'Every step counts towards your health goals.',
          'You\'re not just exercising - you\'re investing in your future.',
          'Progress, not perfection. You\'re doing amazing!'
        ]
      },
      diet: {
        reminders: [
          'Time for a healthy meal! Fuel your body right.',
          'Remember your nutrition goals - you\'ve got this!',
          'Healthy eating reminder: Your body deserves the best.'
        ],
        rewards: [
          'Healthy meal choice! You\'re nourishing your body.',
          'Weekly nutrition goal met! You\'re making great choices.',
          'Monthly healthy eating streak! You\'re transforming your health.'
        ],
        motivational_messages: [
          'Every healthy choice is a step towards better health.',
          'You\'re not just eating - you\'re healing your body.',
          'Your commitment to healthy eating is inspiring.'
        ]
      },
      general: {
        reminders: [
          'Stay focused on your health goals - you\'re doing great!',
          'Remember why you started - your health matters.',
          'Keep going! Every day is a new opportunity to improve.'
        ],
        rewards: [
          'Consistency streak! You\'re building healthy habits.',
          'Goal achieved! Your dedication is paying off.',
          'Milestone reached! You\'re transforming your health.'
        ],
        motivational_messages: [
          'You\'re stronger than you think - keep going!',
          'Every small step leads to big changes.',
          'Your health journey is unique and valuable.'
        ]
      }
    };

    // Reward system
    this.rewardSystem = {
      points: {
        medication_taken: 10,
        exercise_completed: 15,
        healthy_meal: 5,
        goal_achieved: 25,
        streak_7_days: 50,
        streak_30_days: 100,
        milestone_reached: 75
      },
      badges: [
        { name: 'First Steps', description: 'Completed first health action', points: 10 },
        { name: 'Consistency Champion', description: '7-day streak', points: 50 },
        { name: 'Health Warrior', description: '30-day streak', points: 100 },
        { name: 'Goal Crusher', description: 'Achieved monthly goal', points: 75 },
        { name: 'Wellness Master', description: 'Completed all weekly goals', points: 100 }
      ]
    };
  }

  /**
   * Process motivation request
   */
  async process(request) {
    const { 
      userId, 
      action, 
      context = {},
      userProgress = {},
      preferences = {}
    } = request;

    this.log('info', 'Processing motivation request', { 
      userId, 
      action,
      context: Object.keys(context)
    });

    try {
      // Generate appropriate motivation based on action and context
      const motivation = this.generateMotivation(action, context, userProgress);
      
      // Calculate rewards if applicable
      const rewards = this.calculateRewards(action, userProgress);
      
      // Generate personalized message
      const personalizedMessage = this.personalizeMessage(motivation, preferences, userProgress);
      
      // Create reminder schedule if needed
      const reminderSchedule = this.createReminderSchedule(action, context, preferences);
      
      // Update user progress and points
      await this.updateUserProgress(userId, action, rewards);

      // Log the motivation interaction
      await this.logMotivationInteraction(userId, action, motivation, rewards);

      this.log('info', 'Motivation generated successfully', {
        messageType: motivation.type,
        pointsAwarded: rewards.points || 0,
        badgesEarned: rewards.badges?.length || 0
      });

      return {
        success: true,
        motivation: personalizedMessage,
        rewards,
        reminderSchedule,
        agent: this.name,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log('error', 'Motivation generation failed', error.message);
      return {
        success: false,
        error: error.message,
        agent: this.name,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate motivation based on action and context
   */
  generateMotivation(action, context, userProgress) {
    const actionType = this.categorizeAction(action);
    const strategies = this.motivationStrategies[actionType] || this.motivationStrategies.general;
    
    let messageType = 'reminder';
    let message = '';

    // Determine message type based on context
    if (context.completed) {
      messageType = 'reward';
      message = this.selectRandomMessage(strategies.rewards);
    } else if (context.streak && context.streak > 0) {
      messageType = 'milestone';
      message = this.generateMilestoneMessage(context.streak, actionType);
    } else if (context.reminder) {
      messageType = 'reminder';
      message = this.selectRandomMessage(strategies.reminders);
    } else {
      messageType = 'motivational';
      message = this.selectRandomMessage(strategies.motivational_messages);
    }

    return {
      type: messageType,
      message,
      actionType,
      context
    };
  }

  /**
   * Categorize action type
   */
  categorizeAction(action) {
    if (action.includes('medication') || action.includes('pill') || action.includes('dose')) {
      return 'medication_adherence';
    }
    if (action.includes('exercise') || action.includes('workout') || action.includes('activity')) {
      return 'exercise';
    }
    if (action.includes('meal') || action.includes('food') || action.includes('eat')) {
      return 'diet';
    }
    return 'general';
  }

  /**
   * Select random message from array
   */
  selectRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate milestone message
   */
  generateMilestoneMessage(streak, actionType) {
    const milestones = {
      7: 'Amazing! You\'ve maintained your routine for a full week!',
      14: 'Incredible! Two weeks of consistency - you\'re building real habits!',
      30: 'Outstanding! A full month of dedication - you\'re transforming your health!',
      60: 'Phenomenal! Two months of commitment - you\'re a health champion!',
      90: 'Extraordinary! Three months of consistency - you\'ve mastered healthy habits!'
    };

    return milestones[streak] || `Great job! You\'ve maintained your ${actionType} routine for ${streak} days!`;
  }

  /**
   * Calculate rewards based on action and progress
   */
  calculateRewards(action, userProgress) {
    const rewards = {
      points: 0,
      badges: [],
      achievements: []
    };

    // Award points for action
    const actionType = this.categorizeAction(action);
    const pointValue = this.rewardSystem.points[actionType] || this.rewardSystem.points.goal_achieved;
    rewards.points = pointValue;

    // Check for streak bonuses
    if (userProgress.currentStreak >= 7) {
      rewards.points += this.rewardSystem.points.streak_7_days;
      rewards.achievements.push('7-Day Streak Bonus!');
    }

    if (userProgress.currentStreak >= 30) {
      rewards.points += this.rewardSystem.points.streak_30_days;
      rewards.achievements.push('30-Day Streak Bonus!');
    }

    // Check for new badges
    const newBadges = this.checkForNewBadges(userProgress);
    rewards.badges = newBadges;

    return rewards;
  }

  /**
   * Check for new badges
   */
  checkForNewBadges(userProgress) {
    const newBadges = [];

    // First Steps badge
    if (userProgress.totalActions === 1 && !userProgress.badges.includes('First Steps')) {
      newBadges.push({
        name: 'First Steps',
        description: 'Completed first health action',
        icon: '🌟'
      });
    }

    // Consistency Champion badge
    if (userProgress.currentStreak >= 7 && !userProgress.badges.includes('Consistency Champion')) {
      newBadges.push({
        name: 'Consistency Champion',
        description: '7-day streak',
        icon: '🏆'
      });
    }

    // Health Warrior badge
    if (userProgress.currentStreak >= 30 && !userProgress.badges.includes('Health Warrior')) {
      newBadges.push({
        name: 'Health Warrior',
        description: '30-day streak',
        icon: '⚔️'
      });
    }

    return newBadges;
  }

  /**
   * Personalize message based on preferences and progress
   */
  personalizeMessage(motivation, preferences, userProgress) {
    let message = motivation.message;

    // Add personalization based on preferences
    if (preferences.tone === 'encouraging') {
      message = this.makeEncouraging(message);
    } else if (preferences.tone === 'celebratory') {
      message = this.makeCelebratory(message);
    }

    // Add progress context
    if (userProgress.currentStreak > 0) {
      message += ` You're on a ${userProgress.currentStreak}-day streak!`;
    }

    // Add name if available
    if (preferences.name) {
      message = message.replace('You', preferences.name);
    }

    return message;
  }

  /**
   * Make message more encouraging
   */
  makeEncouraging(message) {
    const encouragingPrefixes = [
      'You\'ve got this! ',
      'Keep up the amazing work! ',
      'You\'re doing fantastic! '
    ];
    return encouragingPrefixes[Math.floor(Math.random() * encouragingPrefixes.length)] + message;
  }

  /**
   * Make message more celebratory
   */
  makeCelebratory(message) {
    const celebratoryEmojis = ['🎉', '🌟', '💪', '🔥', '✨'];
    const emoji = celebratoryEmojis[Math.floor(Math.random() * celebratoryEmojis.length)];
    return `${emoji} ${message} ${emoji}`;
  }

  /**
   * Create reminder schedule
   */
  createReminderSchedule(action, context, preferences) {
    if (!context.needsReminder) return null;

    const actionType = this.categorizeAction(action);
    const reminderTimes = preferences.reminderTimes || this.getDefaultReminderTimes(actionType);

    return {
      action,
      times: reminderTimes,
      frequency: preferences.reminderFrequency || 'daily',
      enabled: true,
      nextReminder: this.calculateNextReminder(reminderTimes[0])
    };
  }

  /**
   * Get default reminder times for action type
   */
  getDefaultReminderTimes(actionType) {
    const defaultTimes = {
      medication_adherence: ['08:00', '14:00', '20:00'],
      exercise: ['07:00', '18:00'],
      diet: ['08:00', '12:00', '18:00'],
      general: ['09:00', '15:00', '21:00']
    };

    return defaultTimes[actionType] || defaultTimes.general;
  }

  /**
   * Calculate next reminder time
   */
  calculateNextReminder(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    const nextReminder = new Date();
    nextReminder.setHours(hours, minutes, 0, 0);

    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    return nextReminder.toISOString();
  }

  /**
   * Update user progress and points
   */
  async updateUserProgress(userId, action, rewards) {
    const pool = require('../config/database');
    
    try {
      // Update or create user progress record
      await pool.query(
        `INSERT INTO user_progress (user_id, total_points, current_streak, total_actions, badges, last_updated)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           total_points = user_progress.total_points + $2,
           current_streak = user_progress.current_streak + 1,
           total_actions = user_progress.total_actions + 1,
           badges = array_cat(user_progress.badges, $5),
           last_updated = NOW()`,
        [
          userId,
          rewards.points,
          1, // streak increment
          1, // action increment
          rewards.badges.map(badge => badge.name)
        ]
      );

      this.log('info', 'User progress updated', { 
        userId, 
        pointsAdded: rewards.points,
        badgesEarned: rewards.badges.length
      });
    } catch (error) {
      this.log('error', 'Failed to update user progress', error.message);
    }
  }

  /**
   * Log motivation interaction
   */
  async logMotivationInteraction(userId, action, motivation, rewards) {
    const pool = require('../config/database');
    
    try {
      await pool.query(
        `INSERT INTO motivation_interactions (id, user_id, action, motivation_type, message, rewards, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          require('crypto').randomUUID(),
          userId,
          action,
          motivation.type,
          motivation.message,
          JSON.stringify(rewards)
        ]
      );
    } catch (error) {
      this.log('error', 'Failed to log motivation interaction', error.message);
    }
  }

  /**
   * Get user motivation stats
   */
  async getUserMotivationStats(userId) {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT * FROM user_progress WHERE user_id = $1`,
        [userId]
      );
      
      return result.rows[0] || {
        total_points: 0,
        current_streak: 0,
        total_actions: 0,
        badges: []
      };
    } catch (error) {
      this.log('error', 'Failed to get user motivation stats', error.message);
      return null;
    }
  }

  /**
   * Send reminder
   */
  async sendReminder(userId, reminderData) {
    // In a real implementation, this would integrate with notification services
    this.log('info', 'Sending reminder', { userId, reminder: reminderData.action });
    
    // Simulate reminder delivery
    return {
      success: true,
      delivered: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    const pool = require('../config/database');
    
    try {
      const result = await pool.query(
        `SELECT u.name, up.total_points, up.current_streak, up.total_actions
         FROM user_progress up
         JOIN users u ON up.user_id = u.id
         ORDER BY up.total_points DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows;
    } catch (error) {
      this.log('error', 'Failed to get leaderboard', error.message);
      return [];
    }
  }
}

module.exports = MotivationAgent;
