# 🍴 Fork Documentation

## About This Fork

This repository is a **fork** of the original [Nanobrowser](https://github.com/nanobrowser/nanobrowser) project by the Nanobrowser Team.

### 🎨 **What's Different in This Fork**

This fork contains **custom UI/UX improvements and design changes**:

- ✅ **Complete Japanese Localization**: All UI components, settings, and error messages translated to Japanese
- ✅ **Enhanced Template System**: Replaced fixed promotional QuickStart items with user-customizable templates
- ✅ **Improved Layout**: Optimized sidebar width and spacing for Japanese text
- ✅ **Custom Default Templates**: User-focused templates (email checking, news summaries, meeting notes)
- ✅ **Enhanced User Experience**: Better form validation, focus management, and accessibility

### 🔄 **Keeping Updated with Upstream**

**Important**: While this fork has custom UI/design changes, it's crucial to keep the **backend functionality** updated with the original repository to ensure:
- Security patches
- Bug fixes  
- New AI model support
- Performance improvements
- API compatibility

## 📋 **Update Process**

### **Setup (One-time)**
```bash
# Add original repository as upstream (already done)
git remote add upstream https://github.com/nanobrowser/nanobrowser.git

# Verify remotes
git remote -v
```

### **Regular Update Process**

#### **1. Commit Your Current Changes**
```bash
# Save your current work
git add .
git commit -m "Save current UI customizations before upstream merge"
git push origin master
```

#### **2. Fetch Latest Changes**
```bash
# Fetch latest changes from original repository
git fetch upstream

# See what's new
git log upstream/master --oneline -10
```

#### **3. Merge Backend Updates**
```bash
# Create backup branch
git checkout -b backup-before-merge
git checkout master

# Merge upstream changes
git merge upstream/master
```

#### **4. Handle Conflicts (If Any)**
If conflicts occur during merge:
```bash
# Check which files have conflicts
git status

# Manually resolve conflicts in affected files
# Keep your UI changes, accept their backend changes
git add <resolved-files>
git commit -m "Resolve merge conflicts - preserve UI customizations"
```

#### **5. Test and Push**
```bash
# Build and test
pnpm install
pnpm build

# Push updated fork
git push origin master
```

## 🛡️ **Files to Protect During Merges**

These files contain your custom UI changes and should be carefully reviewed during merges:

### **UI/Translation Files (Preserve Your Changes)**
- `packages/i18n/locales/en/messages.json` - Japanese translations
- `pages/side-panel/src/components/BookmarkList.tsx` - Template system UI
- `pages/side-panel/src/SidePanel.tsx` - UI integration
- `packages/storage/lib/prompt/favorites.ts` - Default templates
- `pages/options/src/Options.tsx` - Settings layout
- `pages/options/src/components/GeneralSettings.tsx` - Settings UI
- `pages/options/src/components/ModelSettings.tsx` - Model settings UI

### **Backend Files (Accept Upstream Changes)**
- `chrome-extension/src/background/` - Background service worker
- `packages/storage/lib/base/` - Core storage functionality  
- `chrome-extension/lib/` - Core extension logic
- Any new AI model integrations
- API communication modules
- Security-related files

## 📅 **Recommended Update Schedule**

- **Weekly**: Check for upstream updates
- **Monthly**: Perform update merge
- **Immediately**: Security patches or critical bug fixes

## 🚨 **Important Notes**

1. **Always backup** your changes before merging upstream
2. **Test thoroughly** after each merge
3. **Document conflicts** and how you resolved them
4. **Keep this documentation updated** as you make more customizations

## 🆘 **Emergency Recovery**

If a merge goes wrong:
```bash
# Reset to your last working state
git reset --hard backup-before-merge
git checkout master
git reset --hard backup-before-merge
```

## 📞 **Contact & Support**

- **Original Project**: [nanobrowser/nanobrowser](https://github.com/nanobrowser/nanobrowser)
- **Original Discord**: [Discord Community](https://discord.gg/NN3ABHggMK)
- **Fork Maintainer**: This fork focuses on UI/UX improvements while staying compatible with upstream

---

**Remember**: This fork aims to provide a better user experience while maintaining compatibility with the original project's powerful AI automation capabilities! 