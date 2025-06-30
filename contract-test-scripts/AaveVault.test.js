const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AaveVault", function () {
    let aaveVault;
    let mockToken;
    let mockAToken;
    let mockPool;
    let mockAggregator;
    let owner;
    let user;

    const MIN_DEPOSIT = ethers.parseUnits("1", 6); // 1 token with 6 decimals (matches contract MIN_DEPOSIT)
    const MAX_BPS = 10000;
    const REBALANCE_COOLDOWN = 24 * 60 * 60; // 1 day in seconds
    const DECIMALS = 18; // Match the MockERC20 decimals
    const INITIAL_BALANCE = ethers.parseUnits("1000", DECIMALS);

    async function deployAaveVaultFixture() {
        const [owner, user] = await ethers.getSigners();

        // Deploy mock contracts
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const mockToken = await MockERC20.deploy("Mock Token", "MTK", 18);
        await mockToken.waitForDeployment();

        const mockAToken = await MockERC20.deploy("Mock aToken", "aMTK", 18);
        await mockAToken.waitForDeployment();

        const MockAavePool = await ethers.getContractFactory("MockAavePool");
        const mockPool = await MockAavePool.deploy();
        await mockPool.waitForDeployment();
        
        // Set the aToken address in the mock pool
        await mockPool.setAToken(await mockAToken.getAddress());

        const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
        const mockAggregator = await MockAggregatorV3.deploy();
        await mockAggregator.waitForDeployment();

        // Deploy AaveVault
        const AaveVault = await ethers.getContractFactory("AaveVault");
        const aaveVault = await AaveVault.deploy(
            await mockToken.getAddress(),
            await mockAToken.getAddress(),
            await mockPool.getAddress(),
            await mockAggregator.getAddress()
        );
        await aaveVault.waitForDeployment();

        // Setup initial balances - mint to owner since only owner can deposit
        await mockToken.mint(owner.address, INITIAL_BALANCE);
        await mockToken.connect(owner).approve(await aaveVault.getAddress(), INITIAL_BALANCE);

        // Set initial target allocation
        await aaveVault.connect(owner).setTargetAllocation(8000); // 80%


        return { aaveVault, mockToken, mockAToken, mockPool, mockAggregator, owner, user };
    }

    beforeEach(async function () {
        ({ aaveVault, mockToken, mockAToken, mockPool, mockAggregator, owner, user } = 
            await loadFixture(deployAaveVaultFixture));
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await aaveVault.owner()).to.equal(owner.address);
        });

        it("Should set the correct token addresses", async function () {
            expect(await aaveVault.UNDERLYING_TOKEN()).to.equal(await mockToken.getAddress());
            expect(await aaveVault.ATOKEN()).to.equal(await mockAToken.getAddress());
            expect(await aaveVault.POOL()).to.equal(await mockPool.getAddress());
            expect(await aaveVault.PRICE_FEED()).to.equal(await mockAggregator.getAddress());
        });

        it("Should set default target allocation", async function () {
            expect(await aaveVault.targetAllocation()).to.equal(8000);
        });
    });

    describe("Deposits", function () {
        it("Should accept deposits above minimum amount", async function () {
            const depositAmount = MIN_DEPOSIT;
            await expect(aaveVault.connect(owner).deposit(depositAmount))
                .to.emit(aaveVault, "Deposited")
                .withArgs(owner.address, depositAmount);
            
            // Verify total assets was updated
            expect(await aaveVault.totalAssets()).to.equal(depositAmount);
        });

        it("Should reject deposits below minimum amount", async function () {
            const smallAmount = MIN_DEPOSIT - 1n; // 1 wei below minimum
            // Need to mint tokens to owner first
            await mockToken.mint(owner.address, smallAmount);
            await mockToken.connect(owner).approve(await aaveVault.getAddress(), smallAmount);
            
            await expect(
                aaveVault.connect(owner).deposit(smallAmount)
            ).to.be.revertedWith("Amount too small");
        });

        it("Should reject zero amount deposits", async function () {
            await expect(
                aaveVault.connect(owner).deposit(0)
            ).to.be.revertedWith("Amount too small");
        });

        it("Should update total assets after deposit", async function () {
            const depositAmount = MIN_DEPOSIT;
            const initialAssets = await aaveVault.totalAssets();
            await aaveVault.connect(owner).deposit(depositAmount);
            expect(await aaveVault.totalAssets()).to.equal(initialAssets + depositAmount);
        });
    });

    describe("Withdrawals", function () {
        const depositAmount = MIN_DEPOSIT * 2n; // Deposit more than minimum for testing withdrawals
        
        beforeEach(async function () {
            console.log("\n=== Starting Withdrawal Test Setup ===");
            
            // Get all contract addresses
            const vaultAddress = await aaveVault.getAddress();
            const tokenAddress = await mockToken.getAddress();
            const aTokenAddress = await mockAToken.getAddress();
            const poolAddress = await mockPool.getAddress();
            
            console.log("Contract addresses:");
            console.log("- Vault:", vaultAddress);
            console.log("- Token:", tokenAddress);
            console.log("- aToken:", aTokenAddress);
            console.log("- Pool:", poolAddress);
            
            // Set up the mock pool with the aToken address
            console.log("\nSetting aToken in mock pool...");
            await mockPool.setAToken(aTokenAddress);
            console.log("aToken set in mock pool");
            
            // Mint aTokens to the mock pool (simulating Aave's behavior)
            console.log("\nMinting aTokens to pool...");
            await mockAToken.mint(poolAddress, depositAmount * 2n);
            console.log("Minted", (depositAmount * 2n).toString(), "aTokens to pool");
            
            // Mint tokens to the owner and approve the vault to spend them
            console.log("\nMinting tokens to owner...");
            await mockToken.mint(owner.address, depositAmount * 2n);
            console.log("Minted", (depositAmount * 2n).toString(), "tokens to owner");
            
            console.log("Approving vault to spend owner's tokens...");
            await mockToken.connect(owner).approve(vaultAddress, depositAmount * 2n);
            console.log("Approval complete");
            
            // Make a deposit
            console.log("\nMaking deposit to vault...");
            const depositTx = await aaveVault.connect(owner).deposit(depositAmount);
            await depositTx.wait();
            console.log("Deposit transaction complete");
            
            // Verify the vault's aToken balance
            const vaultATokenBalance = await mockAToken.balanceOf(vaultAddress);
            console.log("\nVault aToken balance after deposit:", vaultATokenBalance.toString());
            
            // Verify the mock pool's state
            const poolTokenBalance = await mockToken.balanceOf(poolAddress);
            console.log("Pool token balance:", poolTokenBalance.toString());
            
            // Verify the vault's underlying token balance is 0 (should be all in the pool)
            const vaultTokenBalance = await mockToken.balanceOf(vaultAddress);
            console.log("Vault token balance:", vaultTokenBalance.toString());
            
            // Verify the owner's aToken balance
            const ownerATokenBalance = await mockAToken.balanceOf(owner.address);
            console.log("Owner's aToken balance:", ownerATokenBalance.toString());
            
            console.log("=== Withdrawal Test Setup Complete ===\n");
        });

        it("Should allow partial withdrawals", async function () {
            const withdrawAmount = depositAmount / 2n;
            const initialBalance = await mockToken.balanceOf(owner.address);
            
            await expect(aaveVault.connect(owner).withdraw(withdrawAmount))
                .to.emit(aaveVault, "Withdrawn")
                .withArgs(owner.address, withdrawAmount);
                
            // Verify token transfer
            expect(await mockToken.balanceOf(owner.address)).to.equal(
                initialBalance + withdrawAmount
            );
        });

        it("Should allow full withdrawal", async function () {
            const totalValue = await aaveVault.getTotalValue();
            await expect(aaveVault.connect(owner).withdraw(totalValue))
                .to.emit(aaveVault, "Withdrawn")
                .withArgs(owner.address, totalValue);
        });

        it("Should reject withdrawals exceeding balance", async function () {
            const totalValue = await aaveVault.getTotalValue();
            const largeAmount = totalValue + ethers.parseEther("1");
            await expect(
                aaveVault.connect(owner).withdraw(largeAmount)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should reject zero amount withdrawals", async function () {
            await expect(
                aaveVault.connect(owner).withdraw(0)
            ).to.be.revertedWith("Amount must be > 0");
        });

        it("Should update total assets after withdrawal", async function () {
            // Get the vault address
            const vaultAddress = await aaveVault.getAddress();
            const poolAddress = await mockPool.getAddress();
            const aTokenAddress = await mockAToken.getAddress();
            
            // Get the initial total assets from the vault
            const initialAssets = await aaveVault.getTotalValue();
            console.log("Initial vault assets:", initialAssets.toString());
            
            // Get the owner's initial balance
            const ownerInitialBalance = await mockToken.balanceOf(owner.address);
            console.log("Initial owner balance:", ownerInitialBalance.toString());
            
            // Get the vault's token and aToken balances before withdrawal
            const initialVaultTokenBalance = await mockToken.balanceOf(vaultAddress);
            const initialVaultATokenBalance = await mockAToken.balanceOf(vaultAddress);
            console.log("Initial vault token balance:", initialVaultTokenBalance.toString());
            console.log("Initial vault aToken balance:", initialVaultATokenBalance.toString());
            
            // Calculate a safe amount to withdraw (half of the deposit)
            const withdrawAmount = depositAmount / 2n;
            console.log("Withdraw amount:", withdrawAmount.toString());
            
            // Ensure the Aave pool has enough underlying tokens to cover the withdrawal
            await mockToken.mint(poolAddress, withdrawAmount);
            console.log("Minted", withdrawAmount.toString(), "tokens to pool");
            
            // Perform withdrawal
            const tx = await aaveVault.connect(owner).withdraw(withdrawAmount);
            const receipt = await tx.wait();
            console.log("Withdrawal gas used:", receipt.gasUsed.toString());
            
            // Get the final assets after withdrawal
            const finalAssets = await aaveVault.getTotalValue();
            console.log("Final vault assets:", finalAssets.toString());
            
            // Get the owner's final balance
            const ownerFinalBalance = await mockToken.balanceOf(owner.address);
            console.log("Final owner balance:", ownerFinalBalance.toString());
            
            // Get the vault's token and aToken balances after withdrawal
            const finalVaultTokenBalance = await mockToken.balanceOf(vaultAddress);
            const finalVaultATokenBalance = await mockAToken.balanceOf(vaultAddress);
            console.log("Final vault token balance:", finalVaultTokenBalance.toString());
            console.log("Final vault aToken balance:", finalVaultATokenBalance.toString());
            
            // Verify the owner received the withdrawn amount
            const ownerReceived = ownerFinalBalance - ownerInitialBalance;
            console.log("Owner received:", ownerReceived.toString());
            expect(ownerReceived).to.equal(withdrawAmount);
            
            // Verify the vault's total assets were reduced by the withdrawn amount
            const assetsReduction = initialAssets - finalAssets;
            console.log("Assets reduction:", assetsReduction.toString());
            
            // The vault's total assets should be reduced by the withdrawn amount
            // We're using a greater than or equal check here because the vault might have
            // some underlying tokens that cover part of the withdrawal
            expect(assetsReduction).to.be.at.least(withdrawAmount);
            
            // Verify the vault's aToken balance was reduced by the withdrawn amount
            const aTokenReduction = initialVaultATokenBalance - finalVaultATokenBalance;
            console.log("aToken reduction:", aTokenReduction.toString());
            expect(aTokenReduction).to.equal(withdrawAmount);
        });
    });

    describe("Rebalancing", function () {
        const depositAmount = MIN_DEPOSIT * 10n;
        let initialAllocation;
        
        beforeEach(async function () {
            // Make a deposit first
            await aaveVault.connect(owner).deposit(depositAmount);
            initialAllocation = await aaveVault.targetAllocation();
            
            // Transfer some aTokens to simulate Aave earnings
            await mockAToken.mint(await aaveVault.getAddress(), depositAmount);
        });

        it("Should emit Rebalanced event with correct parameters", async function () {
            // Set a new target allocation (10% less than initial)
            const newAllocation = initialAllocation - 1000n;
            
            // Set the new target allocation (this will trigger a rebalance if difference > 10%)
            await aaveVault.connect(owner).setTargetAllocation(newAllocation);
            
            // Get the current allocation before rebalance
            const currentAllocation = await aaveVault.getCurrentAllocation();
            
            // Explicitly call rebalance
            await expect(aaveVault.connect(owner).rebalance())
                .to.emit(aaveVault, "Rebalanced")
                .withArgs(currentAllocation, newAllocation);
        });

        it("Should respect rebalance cooldown", async function () {
            // Set a new target allocation
            const newAllocation = initialAllocation - 1000n;
            
            // First rebalance
            await aaveVault.connect(owner).setTargetAllocation(newAllocation);
            await aaveVault.connect(owner).rebalance();
            
            // Try to rebalance again before cooldown
            await expect(
                aaveVault.connect(owner).rebalance()
            ).to.be.revertedWith("Cooldown active");
        });

        it("Should allow rebalancing after cooldown", async function () {
            // Set a new target allocation
            const newAllocation = initialAllocation - 1000n;
            
            // First rebalance
            await aaveVault.connect(owner).setTargetAllocation(newAllocation);
            await aaveVault.connect(owner).rebalance();
            
            // Fast forward past cooldown (1 day + 1 second)
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");
            
            // Set another target allocation to trigger rebalance
            const anotherAllocation = newAllocation - 500n;
            await aaveVault.connect(owner).setTargetAllocation(anotherAllocation);
            
            // Should be able to rebalance again
            await expect(aaveVault.connect(owner).rebalance())
                .to.emit(aaveVault, "Rebalanced");
        });

        it("Should not allow non-owner to rebalance", async function () {
            await expect(
                aaveVault.connect(user).rebalance()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Emergency Functions", function () {
        const depositAmount = MIN_DEPOSIT * 10n;
        let aavePool;
        
        beforeEach(async function () {
            // Get the Aave pool
            const aavePoolAddress = await aaveVault.POOL();
            aavePool = await ethers.getContractAt("MockAavePool", aavePoolAddress);
            
            // Mint tokens to the owner and approve the vault
            await mockToken.mint(owner.address, depositAmount * 2n);
            await mockToken.connect(owner).approve(await aaveVault.getAddress(), depositAmount);
            
            // Make a deposit - this will send tokens to the Aave pool
            await aaveVault.connect(owner).deposit(depositAmount);
            
            // Add liquidity to the Aave pool to cover withdrawals
            await mockToken.mint(owner.address, depositAmount * 2n);
            await mockToken.connect(owner).approve(aavePoolAddress, depositAmount * 2n);
            await aavePool.connect(owner).addLiquidity(await aaveVault.UNDERLYING_TOKEN(), depositAmount * 2n);
            
            // Instead of minting aTokens directly, make another deposit to get more aTokens
            await mockToken.mint(owner.address, depositAmount);
            await mockToken.connect(owner).approve(await aaveVault.getAddress(), depositAmount);
            await aaveVault.connect(owner).deposit(depositAmount);
            
            // Verify the vault has both underlying and aTokens
            const vaultTokenBalance = await mockToken.balanceOf(await aaveVault.getAddress());
            const vaultATokenBalance = await mockAToken.balanceOf(await aaveVault.getAddress());
            expect(vaultTokenBalance + vaultATokenBalance).to.be.gt(0);
        });

        it("Should allow emergency withdrawal by owner", async function () {
            // Get initial owner balance
            const initialBalance = await mockToken.balanceOf(owner.address);
            console.log("Initial owner balance:", initialBalance.toString());
            
            // Get the vault address
            const vaultAddress = await aaveVault.getAddress();
            
            // Get the underlying token address
            const underlyingToken = await aaveVault.UNDERLYING_TOKEN();
            
            // Verify the vault has aTokens before withdrawal
            const initialATokenBalance = await mockAToken.balanceOf(vaultAddress);
            console.log("Initial vault aToken balance:", initialATokenBalance.toString());
            expect(initialATokenBalance).to.be.gt(0);
            
            // Ensure the Aave pool has enough tokens to cover the withdrawal
            // Mint tokens directly to the pool contract to cover both initial deposit and additional aTokens
            await mockToken.mint(await aavePool.getAddress(), depositAmount * 2n);
            
            // Get the vault's initial token balance
            const initialVaultTokenBalance = await mockToken.balanceOf(vaultAddress);
            console.log("Initial vault token balance:", initialVaultTokenBalance.toString());
            
            // Get pool's token balance
            const poolTokenBalance = await mockToken.balanceOf(await aavePool.getAddress());
            console.log("Pool token balance:", poolTokenBalance.toString());
            
            // Get pool's aToken balance for the vault
            const poolATokenBalance = await aavePool.getATokenBalance(vaultAddress);
            console.log("Pool aToken balance for vault:", poolATokenBalance.toString());
            
            // Perform emergency withdrawal
            const tx = aaveVault.connect(owner).emergencyWithdraw();
            await expect(tx)
                .to.emit(aaveVault, "EmergencyWithdrawn");
            
            // Verify tokens were withdrawn to owner
            const finalBalance = await mockToken.balanceOf(owner.address);
            console.log("Final owner balance:", finalBalance.toString());
            
            // The owner should receive the underlying tokens from both aTokens and direct balance
            // The vault has depositAmount * 2 aTokens from two deposits
            const expectedWithdrawn = initialATokenBalance + initialVaultTokenBalance;
            console.log("Expected withdrawn amount:", expectedWithdrawn.toString());
            console.log("Actual withdrawn amount:", (finalBalance - initialBalance).toString());
            expect(finalBalance - initialBalance).to.equal(expectedWithdrawn);
            
            // Verify vault has no more aTokens (they were burned during withdrawal)
            const vaultATokenBalance = await mockAToken.balanceOf(vaultAddress);
            console.log("Final vault aToken balance:", vaultATokenBalance.toString());
            expect(vaultATokenBalance).to.equal(0);
            
            // Verify the vault's underlying token balance is 0 (it was all withdrawn)
            const vaultTokenBalance = await mockToken.balanceOf(vaultAddress);
            console.log("Final vault token balance:", vaultTokenBalance.toString());
            expect(vaultTokenBalance).to.equal(0);
            
            // Verify total assets are updated to 0
            const totalAssets = await aaveVault.getTotalValue();
            console.log("Final total assets:", totalAssets.toString());
            expect(totalAssets).to.equal(0);
        });

        it("Should not allow non-owner to perform emergency withdrawal", async function () {
            await expect(
                aaveVault.connect(user).emergencyWithdraw()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Price Feed", function () {
        it("Should return current price", async function () {
            const [price, lastUpdated] = await aaveVault.getCurrentPrice();
            expect(price).to.be.gt(0);
            expect(lastUpdated).to.be.gt(0);
        });
    });
}); 