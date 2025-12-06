const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("MNBToken", function () {
  let MNBToken;
  let mnbToken;
  let owner, user1, user2, complianceAdmin;

  beforeEach(async function () {
    [owner, user1, user2, complianceAdmin] = await ethers.getSigners();

    const MNBTokenFactory = await ethers.getContractFactory("MNBToken");
    mnbToken = await upgrades.deployProxy(
      MNBTokenFactory,
      [
        "MNBara Token",
        "MNB",
        owner.address,
        complianceAdmin.address,
        ethers.parseEther("1000000000") // 1 billion tokens
      ],
      { initializer: "initialize", kind: "uups" }
    );

    await mnbToken.waitForDeployment();

    // Grant roles to owner for testing
    const MINTER_BURNER_ROLE = await mnbToken.MINTER_BURNER_ROLE();
    const PAUSER_ROLE = await mnbToken.PAUSER_ROLE();
    const UPGRADER_ROLE = await mnbToken.UPGRADER_ROLE();
    
    await mnbToken.grantRole(MINTER_BURNER_ROLE, owner.address);
    await mnbToken.grantRole(PAUSER_ROLE, owner.address);
    await mnbToken.grantRole(UPGRADER_ROLE, owner.address);
  });

  describe("Deployment", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await mnbToken.name()).to.equal("MNBara Token");
      expect(await mnbToken.symbol()).to.equal("MNB");
    });

    it("Should have correct initial supply", async function () {
      expect(await mnbToken.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should assign initial supply to owner", async function () {
      expect(await mnbToken.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000000"));
    });
  });

  describe("Roles", function () {
    it("Should have correct role hashes", async function () {
      const MINTER_BURNER_ROLE = await mnbToken.MINTER_BURNER_ROLE();
      const PAUSER_ROLE = await mnbToken.PAUSER_ROLE();
      const UPGRADER_ROLE = await mnbToken.UPGRADER_ROLE();
      const COMPLIANCE_ROLE = await mnbToken.COMPLIANCE_ROLE();

      expect(MINTER_BURNER_ROLE).to.equal(ethers.keccak256(ethers.toUtf8Bytes("MINTER_BURNER_ROLE")));
      expect(PAUSER_ROLE).to.equal(ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")));
      expect(UPGRADER_ROLE).to.equal(ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE")));
      expect(COMPLIANCE_ROLE).to.equal(ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ROLE")));
    });
  });

  describe("Compliance Features", function () {
    it("Should set tier daily limits", async function () {
      await mnbToken.connect(complianceAdmin).setTierDailyLimit(1, ethers.parseEther("1000"));
      expect(await mnbToken.tierDailyLimits(1)).to.equal(ethers.parseEther("1000"));
    });

    it("Should freeze and unfreeze accounts", async function () {
      await mnbToken.connect(complianceAdmin).freezeAccount(user1.address);
      expect(await mnbToken.frozenAccounts(user1.address)).to.be.true;

      await mnbToken.connect(complianceAdmin).unfreezeAccount(user1.address);
      expect(await mnbToken.frozenAccounts(user1.address)).to.be.false;
    });

    it("Should prevent transfers from frozen accounts", async function () {
      await mnbToken.transfer(user1.address, ethers.parseEther("100"));
      await mnbToken.connect(complianceAdmin).freezeAccount(user1.address);

      await expect(
        mnbToken.connect(user1).transfer(user2.address, ethers.parseEther("50"))
      ).to.be.revertedWith("Account is frozen");
    });
  });

  describe("Minting and Burning", function () {
    it("Should mint new tokens", async function () {
      const initialBalance = await mnbToken.balanceOf(owner.address);
      await mnbToken.mint(user1.address, ethers.parseEther("1000"));
      
      expect(await mnbToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
      expect(await mnbToken.totalSupply()).to.equal(initialBalance + ethers.parseEther("1000"));
    });

    it("Should burn tokens", async function () {
      const initialBalance = await mnbToken.balanceOf(owner.address);
      await mnbToken.burn(ethers.parseEther("1000"));
      
      expect(await mnbToken.balanceOf(owner.address)).to.equal(initialBalance - ethers.parseEther("1000"));
      expect(await mnbToken.totalSupply()).to.equal(initialBalance - ethers.parseEther("1000"));
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause transfers", async function () {
      await mnbToken.pause();
      expect(await mnbToken.paused()).to.be.true;

      await expect(
        mnbToken.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");

      await mnbToken.unpause();
      expect(await mnbToken.paused()).to.be.false;

      await mnbToken.transfer(user1.address, ethers.parseEther("100"));
      expect(await mnbToken.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Transfer Limits", function () {
    beforeEach(async function () {
      await mnbToken.transfer(user1.address, ethers.parseEther("5000"));
      await mnbToken.connect(complianceAdmin).setUserTier(user1.address, 2);
      await mnbToken.connect(complianceAdmin).setTierDailyLimit(2, ethers.parseEther("1000"));
    });

    it("Should enforce daily transfer limits", async function () {
      // First transfer should work
      await mnbToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      
      // Second transfer should exceed daily limit
      await expect(
        mnbToken.connect(user1).transfer(user2.address, ethers.parseEther("600"))
      ).to.be.revertedWith("Daily transfer limit exceeded");
    });

    it("Should reset daily limits after 24 hours", async function () {
      await mnbToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      
      // Should be able to transfer again
      await mnbToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
    });
  });
});