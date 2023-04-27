const Tether = artifacts.require('Tether');
const RWD = artifacts.require('RWD');
const DecentralBank = artifacts.require('DecentralBank');

require('chai')
.use(require('chai-as-promised'))
.should()

contract('DecentralBank', ([owner, customer]) => {
    let tether, rwd, decentralBank

    function tokens(number){
        return web3.utils.toWei(number, 'ether')
    }

    before(async () => {
        // Load contracts
        tether = await Tether.new()
        rwd = await RWD.new()
        decentralBank = await DecentralBank.new(rwd.address, tether.address)

        //Transfer all tokens to decentralBank(1 million)
        await rwd.transfer(decentralBank.address, tokens('1000000'))

        //Transfer 100 Mock Tether tokens to customer
        await tether.transfer(customer, tokens('100'), {from: owner})

    })

    describe('Mock Tether Deployment', async () => {
        it('matches name successfully', async () => {
            const name = await tether.name()
            assert.equal(name, 'Mock Tether Token')
        })
    })

    describe('Reward Token Deployment', async () => {
        it('matches name successfully', async () => {
             const name = await rwd.name()
            assert.equal(name, 'Reward Token')
        })
    })

    describe('Decentral Bank Deployment', async () => {
        it('matches name successfully', async () => {
             const name = await decentralBank.name()
            assert.equal(name, 'Decentral Bank')
        })

        it('contract has token', async () =>{
           let balance = await rwd.balanceOf(decentralBank.address)
           assert.equal(balance, tokens('1000000'))
        })

        describe('Yield Farming', async () => {
            it('rewards tokens for staking', async () => {
                let result

                //check investor balance
                result = await tether.balanceOf(customer)
                assert.equal(result.toString(), tokens('100'), 'customer mock wallent balance before staking')

            //check staking for customer of 100 token
            await tether.approve(decentralBank.address, tokens('100'), {from: customer})
            await decentralBank.depositToken(tokens('100'), {from: customer})

            //check for updated balance of customer
            result = await tether.balanceOf(customer)
            assert.equal(result.toString(), tokens('0'), 'customer mock wallent balance after staking  100 tokens')

            //check updated balance of decentral Bank
            result = await tether.balanceOf(decentralBank.address)
            assert.equal(result.toString(), tokens('100'), 'decentral bank mock wallent balance after staking from customer')

            //is staking update
            result = await decentralBank.isStaked(customer)
            assert.equal(result.toString(), 'true', 'customer staking status after staking')

            //issue tokens
            await decentralBank.issueTokens({from: owner})

            //iensure only the owner can issue tokens
            await decentralBank.issueTokens({from: customer}).should.be.rejected;

            //unstake tokens
            await decentralBank.unstakeTokens({from: customer})

            //check unstaking balances
            result = await tether.balanceOf(customer)
            assert.equal(result.toString(), tokens('100'), 'customer mock wallent balance after unstaking tokens')

            //check updated balance of decentral Bank
            result = await tether.balanceOf(decentralBank.address)
            assert.equal(result.toString(), tokens('0'), 'decentral bank mock wallent balance after staking from customer')

            //is staking update
            result = await decentralBank.isStaked(customer)
            assert.equal(result.toString(), 'false', 'customer is no longer staking after unstaking')

            })
        })
    })
})