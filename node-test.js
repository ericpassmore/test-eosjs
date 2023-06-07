import { Api, JsonRpc, RpcError } from 'enf-eosjs';
import fetch from 'node-fetch' ;
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig.js';

const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
const privateKey = '5JJBHqug5hX1cH91R5u3oMiA3ncHYW395PPmHQbfUshJikGDCBv';
const testActor = 'hokieshokies'
const testRecipient = 'alicetestlio'
const signatureProvider = new JsSignatureProvider([privateKey]);
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const info = await rpc.get_info();

console.log("*************** GET INFO *******************");
console.log(info);


const transactWithConfig = async () => await api.transact({
    actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
            actor: testActor,
            permission: 'active',
        }],
        data: {
            from: testActor,
            to: testRecipient,
            quantity: '0.0001 EOS',
            memo: '',
        },
    }]
}, {
    blocksBehind: 1,
    searchBlocksAhead: 1,
    expireSeconds: 720,
});

const transactWithoutConfig = async () => {
    const transactionResponse = await transactWithConfig();
    const blockInfo = await rpc.get_block(transactionResponse.processed.block_num - 3);
    const currentDate = new Date();
    const timePlusTen = currentDate.getTime() + 10000;
    const timeInISOString = (new Date(timePlusTen)).toISOString();
    const expiration = timeInISOString.substring(0, timeInISOString.length - 1);

    return await api.transact({
        expiration,
        ref_block_num: blockInfo.block_num & 0xffff,
        ref_block_prefix: blockInfo.ref_block_prefix,
        actions: [{
            account: 'eosio.token',
            name: 'transfer',
            authorization: [{
                actor: testActor,
                permission: 'active',
            }],
            data: {
                from: testActor,
                to: testRecipient,
                quantity: '0.0001 EOS',
                memo: '',
            },
        }]
    });
};


const transactWithoutBroadcast = async () => await api.transact({
    actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
            actor: testActor,
            permission: 'active',
        }],
        data: {
            from: testActor,
            to: testRecipient,
            quantity: '0.0001 EOS',
            memo: '',
        },
    }]
}, {
    broadcast: false,
    blocksBehind: 1,
    searchBlocksAhead: 1,
    expireSeconds: 720,
});


const transactWithRetry = async () =>
    await api.transact(
        {
            actions: [
                {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                        {
                            actor: testActor,
                            permission: 'active',
                        }],
                    data: {
                        from: testActor,
                        to: testRecipient,
                        quantity: '0.0001 EOS',
                        memo: '',
                    },
                }],
        },
        {
            broadcast: false,
            blocksBehind: 1,
            searchBlocksAhead: 1,
            expireSeconds: 720,
            retryTrxNumBlocks: 10,
        }
    )

const transactWithRetryIrreversible = async () =>
    await api.transact(
        {
            actions: [
                {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                        {
                            actor: testActor,
                            permission: 'active',
                        }],
                    data: {
                        from: testActor,
                        to: testRecipient,
                        quantity: '0.0001 EOS',
                        memo: '',
                    },
                }],
        },
        {
            broadcast: false,
            blocksBehind: 1,
            searchBlocksAhead: 1,
            expireSeconds: 720,
            retryIrreversible: true,
        }
    )

// change this to read
const readonlyTransfer = async () =>
    await api.transact(
        {
            actions: [
                {
                    account: testActor,
                    name: 'getvalue',
                    authorization: [],
                    data: {},
                },
            ],
        },
        {
            broadcast: true,
            readOnly: true,
            blocksBehind: 1,
            searchBlocksAhead: 1,
            expireSeconds: 720,
        }
    )

const broadcastResult = async (signaturesAndPackedTransaction) => await api.pushSignedTransaction(signaturesAndPackedTransaction);

const transactShouldFail = async () => await api.transact({
    actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
            actor: testActor,
            permission: 'active',
        }],
        data: {
            from: testActor,
            to: testRecipient,
            quantity: '0.0001 EOS',
            memo: '',
        },
    }]
});

const rpcShouldFail = async () => await rpc.get_block(-1);


console.log("\n***************** transaction with config *******************")
const transactionWithConfigResponse = await transactWithConfig();
console.log(`Transaction Id ${transactionWithConfigResponse.transaction_id}`)

console.log("\n***************** transaction read only *******************")
await sleep(100)
const transactionReadOnlyResponse = await readonlyTransfer();
console.log(`Transaction Id ${transactionReadOnlyResponse.transaction_id} CPU Usage ${transactionReadOnlyResponse.processed.receipt.cpu_usage_us}`)


console.log("\n***************** transaction without config *******************")
await sleep(100)
const transactionWithoutConfigResponse = await transactWithoutConfig();
console.log(`Transaction Id ${transactionWithoutConfigResponse.transaction_id}`)

console.log("\n***************** transaction without broadcast *******************")
const transactionSignatures = await transactWithoutBroadcast();
console.log(`Transaction Id ${transactionSignatures.signatures}`)
console.log(`Transaction Id ${transactionSignatures.serializedTransaction}`)

console.log("\n***************** transaction broadcast with signatures *******************")
await sleep(700)
const transactionBroadcastSignatures = await transactWithoutBroadcast();
const transactionBroadcastSignaturesResponse = await broadcastResult(transactionBroadcastSignatures);
console.log(`Transaction Id ${transactionBroadcastSignaturesResponse.transaction_id}`)


console.log("\n***************** retry transaction *******************")
await sleep(700)
const transactionRetrySignatures = await transactWithRetry();
const transactionRetryResponse = await broadcastResult(transactionRetrySignatures);
console.log(`Transaction Id ${transactionRetryResponse.transaction_id}`)


console.log("\n***************** irreversible transaction *******************")
await sleep(700)
const transactionSignatures2 = await transactWithRetryIrreversible();
const transactionIrreversibleResponse = await broadcastResult(transactionSignatures2);
console.log(`Transaction Id ${transactionIrreversibleResponse.transaction_id}`)


console.log("\n***************** throws appropriate error message without configuration object or TAPOS in place *******************")
let failedAsPlanned = true;
try {
    failedAsPlanned = true;
    await transactShouldFail();
    failedAsPlanned = false;
} catch (e) {
    if (e.message !== 'Required configuration or TAPOS fields are not present') {
        failedAsPlanned = false;
    }
}
if (failedAsPlanned) { console.log(" YEAH IT FAILED AS EXPECTED") } else { console.log(" BOO!!! IT SUCCEEDED UNEXPECTED AND BAD") }

console.log("\n***************** throws an an error with RpcError structure for invalid RPC calls *******************")
try {
    failedAsPlanned = true;
    await rpcShouldFail();
    failedAsPlanned = false;
} catch (e) {
    if (!e.json || !e.json.error || !(e.json.error.hasOwnProperty('details'))) {
        failedAsPlanned = false;
    }
}
if (failedAsPlanned) { console.log(" YEAH IT FAILED AS EXPECTED") } else { console.log(" BOO!!! IT SUCCEEDED UNEXPECTED AND BAD") }