// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import "bootstrap/dist/css/bootstrap.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';



// Import our contract artifacts and turn them into usable abstractions.
import myWallet_artifact from '../../build/contracts/MyWallet.json'

// Wallet is our usable abstraction, which we'll use through the code below.
var MyWallet = contract(myWallet_artifact);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    MyWallet.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
      
      // document.getElementById("cur_ac").innerHTML  = ""+accounts[2];

      for(var i in accounts){
        document.getElementById("addresses").innerHTML += '<span style="cursor: pointer;" onclick="App.copy('+i+')">'+accounts[i]+"</span><br />";
        //document.getElementById("ether_amount").innerHTML += web3.fromWei((web3.eth.getBalance(accounts[i])), "ether")+"<br />";
      }
      

      App.basicInfoUpdate();
      App.listenToEvents();
    });
  },

   copy: function(id) {
    document.getElementById("to").value = accounts[id];
  },



  basicInfoUpdate: function() {
    MyWallet.deployed().then(function(instance) {

      web3.eth.getBalance(instance.address,function(err, res){
        document.getElementById("walletEther").innerHTML = web3.fromWei(res, "ether");
      });
      document.getElementById("walletAddress").innerHTML = instance.address;
      // document.getElementById("walletEther").innerHTML = web3.fromWei(web3.eth.getBalance(instance.address).toNumber(), "ether");
      document.getElementById("ether_amount").innerHTML="";
      for(var i in accounts){

        web3.eth.getBalance(accounts[i],function(err, res){
          document.getElementById("ether_amount").innerHTML += web3.fromWei(res,"ether")+"<br />";
        });

        // document.getElementById("ether_amount").innerHTML += web3.fromWei((web3.eth.getBalance()), "ether")+"<br />";
      }
    })
  },

  listenToEvents: function() {
    MyWallet.deployed().then(function(instance) {
      instance.receivedFunds({},{fromBlock:0, toBlock:'latest'}).watch(function(error, event) {
        var amount = event.args._amount;
        console.log(amount);
        amount = web3.fromWei(amount,"ether");
        document.getElementById("fundEvents").innerHTML += amount+" ether is added to the contract.<br>";
      });
      instance.proposalReceived({},{fromBlock:0, toBlock:'latest'}).watch(function(error, event) {
        var from = event.args._from;
        var to = event.args._to;
        var counter = event.args._counter;
        document.getElementById("proposalEvents").innerHTML += from+" proposes to send "+to+"ethers with a proposal id: "+counter+"<br>";
      });
    });
  },

  confirmTransaction: function() {
    var _id = parseInt(document.getElementById("confirm_id").value);
    console.log(_id);
    MyWallet.deployed().then(function(instance){
        return instance.confirmProposal(_id,{from:accounts[0]});
    }).then(function(result) {
      App.basicInfoUpdate();
    });
  },

  submitEtherToWallet: function() {
    MyWallet.deployed().then(function(instance) {

      return instance.sendTransaction({from: account, to: instance.address, value: web3.toWei(5, "ether")});

    }).then(function(result) {
      App.basicInfoUpdate();
    });
  },

  submitTransaction: function() {
    var _to = document.getElementById("to").value;
    var _amount = parseInt(document.getElementById("amount").value);
    var _reason = document.getElementById("reason").value;

    MyWallet.deployed().then(function(instance) {
      return instance.spendMoneyOn(_to, web3.toWei(_amount, 'ether'), _reason, {from:accounts[2], gas:500000});
    }).then(function(result) {
      console.log(result);
      App.basicInfoUpdate();
    }).catch(function(err) {
      console.error(err);
    });
  },

  sendCoin: function() {
    var self = this;
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
  }

  App.start();
});
