import { SKILL_XP_TABLE, SKILL_BONUSES } from '../config/skillData.js';

export class SkillSystem {
  constructor(scene) {
    this.scene = scene;
    this.skills = {
      fishing: { xp: 0, level: 1 },
      mining:  { xp: 0, level: 1 },
      farming: { xp: 0, level: 1 },
      cooking: { xp: 0, level: 1 },
    };
  }

  addXP(skillId, amount) {
    const skill = this.skills[skillId];
    if (!skill || skill.level >= 10) return;

    skill.xp += amount;

    const nextLevelXP = SKILL_XP_TABLE[skill.level + 1];
    if (nextLevelXP !== undefined && skill.xp >= nextLevelXP) {
      skill.level++;
      const unlock = SKILL_BONUSES[skillId].unlocks[skill.level] || null;
      this.scene.events.emit('skillLevelUp', {
        skillId,
        newLevel: skill.level,
        unlock,
      });
      // Check for further level-ups from a large XP gain
      this.addXP(skillId, 0);
      return;
    }

    if (amount > 0) {
      this.scene.events.emit('skillXPGained', {
        skillId,
        amount,
        currentXP: skill.xp,
        level: skill.level,
        nextLevelXP: SKILL_XP_TABLE[skill.level + 1] ?? null,
      });
    }
  }

  getLevel(skillId) {
    return this.skills[skillId]?.level || 1;
  }

  getBonus(skillId, bonusKey) {
    const level = this.getLevel(skillId);
    const bonusDef = SKILL_BONUSES[skillId];
    const perLevelValue = bonusDef[bonusKey];
    if (perLevelValue === undefined) return 0;
    return perLevelValue * (level - 1);
  }

  hasUnlock(skillId, unlockId) {
    const level = this.getLevel(skillId);
    const unlocks = SKILL_BONUSES[skillId].unlocks;
    for (const [lvl, unlock] of Object.entries(unlocks)) {
      if (parseInt(lvl) <= level && unlock.id === unlockId) return true;
    }
    return false;
  }

  hasPerk(skillId, perkId) {
    return this.hasUnlock(skillId, perkId);
  }

  getSkillProgress(skillId) {
    const skill = this.skills[skillId];
    const currentThreshold = SKILL_XP_TABLE[skill.level];
    const nextThreshold = SKILL_XP_TABLE[skill.level + 1];
    if (!nextThreshold) return { level: skill.level, progress: 1.0, isMax: true, xp: skill.xp };

    const progressXP = skill.xp - currentThreshold;
    const neededXP = nextThreshold - currentThreshold;

    return {
      level: skill.level,
      xp: skill.xp,
      progress: progressXP / neededXP,
      progressXP,
      neededXP,
      isMax: false,
    };
  }
}
