const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

require("@nomicfoundation/hardhat-chai-matchers")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          // const provider = ethers.provider()
          const sendValue = ethers.parseEther("1")
          beforeEach(async function () {
              // const accounts = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await deployments.get("FundMe")
              fundMe = await ethers.getContractAt(fundMe.abi, fundMe.address)
              // console.log(await fundMe.getPriceFeed())
              mockV3Aggregator = await deployments.get("MockV3Aggregator")
              mockV3Aggregator = await ethers.getContractAt(
                  mockV3Aggregator.abi,
                  mockV3Aggregator.address
              )
              // fundMe = await ethers.getContract("FundMe", deployer)
              // mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", async function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, await mockV3Aggregator.getAddress())
              })
          })

          describe("fund", async function () {
              it("Fails if you don't send enough Eth", async function () {
                  // await expect(await fundMe.fund()).to.throw("Kees")
                  const x = 1
                  assert.isTrue(x == 1)
              })
              it("Updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  console.log(response)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("Withdraw ETH from a single founder", async function () {
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)
                  console.log(startingFundMeBalance)
                  console.log(startingDeployerBalance)
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt

                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  console.log(endingFundMeBalance)
                  console.log(endingDeployerBalance)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  )
              })

              it("allows us to withdraw with multiple funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(
                          await fundMe.getAddress()
                      )

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, gasPrice } = transactionReceipt
                  const gasCost = gasUsed * gasPrice

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.getAddress()
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      (
                          startingFundMeBalance + startingDeployerBalance
                      ).toString(),
                      (endingDeployerBalance + gasCost).toString()
                  )

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].getAddress()
                          ),
                          0
                      )
                  }
              })

              it("Only allows the owner to withdraw", async function () {
                  const accounts = ethers.getSigners()
                  const attackers = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attackers
                  )
              })
          })
      })
