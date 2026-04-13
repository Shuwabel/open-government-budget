const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Government Budget Transparency Contracts...");

  // Get the contract factories
  const BudgetTransparency = await ethers.getContractFactory("BudgetTransparency");
  const BudgetCertificate = await ethers.getContractFactory("BudgetCertificate");

  // Deploy BudgetTransparency contract
  console.log("📋 Deploying BudgetTransparency contract...");
  const budgetTransparency = await BudgetTransparency.deploy();
  await budgetTransparency.waitForDeployment();
  console.log("✅ BudgetTransparency deployed to:", await budgetTransparency.getAddress());

  // Deploy BudgetCertificate contract
  console.log("🏆 Deploying BudgetCertificate contract...");
  const budgetCertificate = await BudgetCertificate.deploy();
  await budgetCertificate.waitForDeployment();
  console.log("✅ BudgetCertificate deployed to:", await budgetCertificate.getAddress());

  // Grant MINTER_ROLE to BudgetTransparency contract
  console.log("🔐 Setting up permissions...");
  const MINTER_ROLE = await budgetCertificate.MINTER_ROLE();
  await budgetCertificate.grantRole(MINTER_ROLE, await budgetTransparency.getAddress());
  console.log("✅ MINTER_ROLE granted to BudgetTransparency");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      BudgetTransparency: {
        address: await budgetTransparency.getAddress(),
        transactionHash: budgetTransparency.deploymentTransaction().hash
      },
      BudgetCertificate: {
        address: await budgetCertificate.getAddress(),
        transactionHash: budgetCertificate.deploymentTransaction().hash
      }
    }
  };

  console.log("\n📄 Deployment Summary:");
  console.log("======================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Timestamp: ${deploymentInfo.timestamp}`);
  console.log(`BudgetTransparency: ${deploymentInfo.contracts.BudgetTransparency.address}`);
  console.log(`BudgetCertificate: ${deploymentInfo.contracts.BudgetCertificate.address}`);

  // Save to file
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '..', 'lib', 'blockchain', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update your .env.local with the contract addresses");
  console.log("2. Verify contracts on Polygonscan (optional)");
  console.log("3. Test the contracts with sample data");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

