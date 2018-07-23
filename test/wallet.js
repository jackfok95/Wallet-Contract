var wallet = artifacts.require("./MyWallet.sol");

contract("MyWallet", function(accounts) {
    it('should be possible to put money inside the contract', function() {
       var contractInstance;

       //the function get back the deployed wallet contract as "instance"
        return wallet.deployed().then(function(instance) {
            contractInstance = instance;
            // The result of the sendTransaction() will be passed to the next "then(function(result))"
            return contractInstance.sendTransaction({value: web3.toWei(10, 'ether'),
                   address:contractInstance.address, from: accounts[0]});
                   
        }).then(function(results) {
           assert.equal(web3.eth.getBalance(contractInstance.address).toNumber(),
           web3.toWei(10, 'ether'), 'The Balance is the same');
        });
    });

    it('should be possible to get money back as the owner', function() {
        var walletInstance;
        var balanceBeforeSend;
        var balanceAfterSend;
        var amountToSend = web3.toWei(5, 'ether');
        return wallet.deployed().then(function(instance) {
            walletInstance = instance;
            balanceBeforeSend = web3.eth.getBalance(instance.address).toNumber();
            return walletInstance.spendMoneyOn(accounts[0], amountToSend, "Because I'm the owner", {from: accounts[0]});
        }).then(function() {
            return web3.eth.getBalance(walletInstance.address).toNumber();
        }).then(function(balance) {
            balanceAfterSend = balance;
            assert.equal(balanceBeforeSend - amountToSend, balanceAfterSend, 'Balance is now 5 ether less than before');
        });
    });

    it('should be possible to propose and confirm spending money', function() {
        var walletInstance;
        return wallet.deployed().then(function(instance) {
            walletInstance = instance;
            return walletInstance.spendMoneyOn(accounts[1], web3.toWei(2,'ether'), "Because I need money", {from: accounts[1]});
         })//then(function(transactionResult) {
        //     return walletInstance.spendMoneyOn(accounts[1], web3.toWei(2,'ether'), "Because I neeed money", {from: accounts[1]});

        // })      
        
        .then(function(transactionResult) {
            assert.equal(web3.eth.getBalance(walletInstance.address).toNumber(), web3.toWei(5, 'ether'), 'Balance is 5 ether less than before');
            //console.log(transactionResult.logs[0].args._counter.toNumber());
            return walletInstance.confirmProposal(transactionResult.logs[0].args._counter.toNumber(), {from: accounts[0]})
        }).then(function() {
          return web3.eth.getBalance(walletInstance.address).toNumber();
        }).then(function(balance) {
          assert.equal(balance, web3.toWei(3, 'ether'), 'Wallet balance is 0 now.');
        });
    });

});