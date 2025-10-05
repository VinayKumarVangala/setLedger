const UserProfile = require('../models/UserProfile');

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = new UserProfile({ userId, orgId: userId.split('_')[0] });
      await profile.save();
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { ...updates, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrgTheme = async (req, res) => {
  try {
    const { orgId } = req.params;
    const profiles = await UserProfile.find({ orgId });
    const orgTheme = profiles.find(p => p.preferences.orgTheme)?.preferences.orgTheme || 'light';
    
    res.json({ orgTheme });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserProfile, updateUserProfile, getOrgTheme };