# 📚 Blockchain-based Financial Literacy Platform

Welcome to an innovative Web3 solution for boosting financial literacy! This project uses the Stacks blockchain to create engaging, token-based educational programs where users complete modules, earn rewards, and unlock certifications. It addresses the real-world problem of widespread financial illiteracy by making learning interactive, verifiable, and incentivized—helping users build skills in budgeting, investing, debt management, and more, with blockchain-secured progress and credentials that can be shared with employers or institutions.

## ✨ Features

📖 Modular courses on key financial topics (e.g., basics, investing, retirement planning)
💰 Earn fungible tokens (SIP-10 compliant) for completing quizzes and modules
🔓 Unlock advanced modules by spending or staking earned tokens
🏆 Mint NFTs (SIP-09 compliant) as verifiable certifications upon program completion
👥 User profiles with progress tracking and achievement badges
✅ On-chain verification of knowledge via assessments
🔒 Secure, immutable records of learning milestones to prevent fraud
📊 Governance for community-driven content updates

## 🛠 How It Works

**For Learners**

- Register your profile on the platform.
- Start with free beginner modules: Read content, take quizzes, and earn tokens upon passing.
- Use earned tokens to unlock premium or advanced modules (e.g., stake tokens to access investment strategies).
- Track progress on-chain—complete all required modules to mint a certification NFT.
- Share your NFT certificate as proof of financial literacy skills.

**For Educators/Verifiers**

- Use get-user-progress to view a learner's achievements.
- Call verify-certification to confirm the authenticity of an NFT.
- Participate in governance to propose new modules or updates.

That's it! Learners get motivated by rewards, and certifications are tamper-proof on the blockchain.

## 🔗 Smart Contracts (in Clarity)

This project involves 8 smart contracts written in Clarity for the Stacks blockchain, ensuring decentralized and secure operations:

1. **UserRegistry.clar**: Handles user registration, profile creation, and basic authentication.
2. **ModuleManager.clar**: Defines and stores educational modules, including content hashes, prerequisites, and unlock requirements.
3. **ProgressTracker.clar**: Tracks user completion of modules and quizzes, storing progress immutably.
4. **LiteracyToken.clar**: SIP-10 fungible token contract for rewarding users (e.g., mint tokens on quiz success).
5. **CertificationNFT.clar**: SIP-09 NFT contract for minting unique certifications upon full program completion.
6. **AssessmentEngine.clar**: Manages quizzes and assessments, verifying answers on-chain for module completion.
7. **StakingRewards.clar**: Allows users to stake tokens to unlock modules or earn bonus rewards for long-term engagement.
8. **GovernanceDAO.clar**: Enables token holders to vote on updates to modules, rewards, or platform rules.

These contracts interact seamlessly: For example, completing a quiz in AssessmentEngine triggers a token mint in LiteracyToken, which can then be used in ModuleManager to unlock the next level.

## 🚀 Getting Started

1. Set up a Stacks wallet (e.g., Hiro Wallet).
2. Deploy the contracts using the Clarity CLI.
3. Interact via a frontend dApp: Register, complete modules, and watch your financial knowledge (and wallet) grow!

This project empowers individuals in underserved communities by making financial education accessible, gamified, and credentialed—solving the global issue of financial inequality through blockchain transparency.