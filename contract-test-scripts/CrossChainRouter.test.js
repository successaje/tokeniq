const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CrossChainRouter", function () {
    let router;
    let mockRouter;
    let mockLinkToken;
    let mockToken;
    let owner;
    let user;
    let destinationChainSelector;

    const DESTINATION_CHAIN = 2;
    const AMOUNT = ethers.parseEther("1");

    async function deployCrossChainRouterFixture() {
        const [owner, user] = await ethers.getSigners();
        destinationChainSelector = 1;

        // Deploy mock contracts
        const MockRouter = await ethers.getContractFactory("MockRouter");
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const MockLinkToken = await ethers.getContractFactory("MockERC20");

        mockRouter = await MockRouter.deploy();
        await mockRouter.waitForDeployment();
        const mockRouterAddress = await mockRouter.getAddress();
        console.log("mockRouterAddress - ", mockRouterAddress);

        mockToken = await MockERC20.deploy("Test Token", "TEST", 2);
        await mockToken.waitForDeployment();
        const mockTokenAddress = await mockToken.getAddress();
        console.log("mockTokenAddress - ", mockTokenAddress);

        mockLinkToken = await MockLinkToken.deploy("Chainlink", "LINK", 18);
        await mockLinkToken.waitForDeployment();
        const mockLinkTokenAddress = await mockLinkToken.getAddress();
        console.log("mockLinkTokenAddress - ", mockLinkTokenAddress);

       

        // Deploy CrossChainRouter
        const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
        router = await CrossChainRouter.deploy(
            mockRouterAddress,
            mockLinkTokenAddress
        );
        await router.waitForDeployment();

        // Setup initial balances
        await mockToken.mint(user.address, ethers.parseEther("1000"));
        await mockLinkToken.mint(await router.getAddress(), ethers.parseEther("1000"));

        // Approve tokens
        await mockToken.connect(user).approve(await router.getAddress(), ethers.MaxUint256);

        // Setup supported chain and token
        await router.setSupportedChain(destinationChainSelector, true);
        await router.setSupportedToken(await mockToken.getAddress(), true);

        return { router, mockRouter, mockLinkToken, mockToken, owner, user };
    }

    beforeEach(async function () {
        ({ router, mockRouter, mockLinkToken, mockToken, owner, user } = 
            await loadFixture(deployCrossChainRouterFixture));
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await router.owner()).to.equal(owner.address);
        });

        it("Should set the correct router address", async function () {
            expect(await router.router()).to.equal(await mockRouter.getAddress());
        });

        it("Should set the correct link token address", async function () {
            expect(await router.linkToken()).to.equal(await mockLinkToken.getAddress());
        });
    });

    describe("Chain Management", function () {
        it("Should allow owner to set supported chain", async function () {
            const newChainSelector = 2;
            await router.setSupportedChain(newChainSelector, true);
            expect(await router.supportedChains(newChainSelector)).to.be.true;
        });

        it("Should not allow non-owner to set supported chain", async function () {
            const newChainSelector = 2;
            await expect(
                router.connect(user).setSupportedChain(newChainSelector, true)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Token Management", function () {
        it("Should allow owner to set supported token", async function () {
            const newToken = await ethers.getContractFactory("MockERC20").then(f => f.deploy("New Token", "NEW", 18));
            await router.setSupportedToken(await newToken.getAddress(), true);
            expect(await router.supportedTokens(await newToken.getAddress())).to.be.true;
        });

        it("Should not allow non-owner to set supported token", async function () {
            const newToken = await ethers.getContractFactory("MockERC20").then(f => f.deploy("New Token", "NEW", 18));
            await expect(
                router.connect(user).setSupportedToken(await newToken.getAddress(), true)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Cross-chain Operations", function () {
        it("Should handle multiple consecutive transfers", async function () {
            const amount = ethers.parseEther("100");
            const mockTokenAddress = await mockToken.getAddress();
            const routerAddress = await router.getAddress();

            await router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount);
            await router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount);
            expect(await mockToken.balanceOf(routerAddress)).to.equal(amount * 2n);
        });

        it("Should emit TokensSent event with correct parameters", async function () {
            const amount = ethers.parseEther("100");
            const mockTokenAddress = await mockToken.getAddress();
            const userAddress = await user.getAddress();

            await expect(router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount))
                .to.emit(router, "TokensSent")
                .withArgs(userAddress, destinationChainSelector, mockTokenAddress, amount);
        });

        it("Should reject zero amount transfers", async function () {
            const mockTokenAddress = await mockToken.getAddress();
            await expect(
                router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, 0)
            ).to.be.revertedWithCustomError(router, "InvalidAmount");
        });

        it("Should reject transfers with insufficient balance", async function () {
            const amount = ethers.parseEther("2000"); // More than user's balance
            const mockTokenAddress = await mockToken.getAddress();
            await expect(
                router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow owner to withdraw LINK and update balances", async function () {
            const amount = ethers.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const initialBalance = await mockLinkToken.balanceOf(ownerAddress);
            await router.withdrawLink(amount);
            const finalBalance = await mockLinkToken.balanceOf(ownerAddress);
            expect(finalBalance - initialBalance).to.equal(amount);
        });

        it("Should allow owner to withdraw ERC20 tokens", async function () {
            const amount = ethers.parseEther("100");
            const mockTokenAddress = await mockToken.getAddress();
            const ownerAddress = await owner.getAddress();

            await router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount);
            await router.withdrawERC20(mockTokenAddress, amount);
            expect(await mockToken.balanceOf(ownerAddress)).to.equal(amount);
        });

        it("Should not allow non-owner to withdraw LINK", async function () {
            const amount = ethers.parseEther("100");
            await expect(
                router.connect(user).withdrawLink(amount)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should not allow non-owner to withdraw ERC20 tokens", async function () {
            const amount = ethers.parseEther("100");
            const mockTokenAddress = await mockToken.getAddress();

            await router.connect(user).sendTokens(destinationChainSelector, mockTokenAddress, amount);
            await expect(
                router.connect(user).withdrawERC20(mockTokenAddress, amount)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
}); 