import solc from 'solc';
import fs from 'node:fs';
import ganache from 'ganache';
import { ethers } from 'ethers';

function compile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const input = { language: 'Solidity', sources: { [file]: { content: source } },
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errs = (out.errors || []).filter(e => e.severity === 'error');
  if (errs.length) throw new Error(errs.map(e => e.formattedMessage).join('\n'));
  const name = Object.keys(out.contracts[file])[0];
  return out.contracts[file][name];
}

const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true } }));
const signer = await provider.getSigner(0);
const other = await provider.getSigner(1);

const mock = compile('contracts/MockAgentID.sol');
const Mock = await new ethers.ContractFactory(mock.abi, '0x' + mock.evm.bytecode.object, signer).deploy();
const poll = JSON.parse(fs.readFileSync('build/AgentPoll.json', 'utf8'));
const Poll = await new ethers.ContractFactory(poll.abi, poll.bytecode, signer).deploy(await Mock.getAddress());
console.log('deployed mock + AgentPoll');

const me = await signer.getAddress(), stranger = await other.getAddress();
await Mock.setHolder(me, 1);
console.log('isAgent(me) =', await Poll.isAgent(me), '| isAgent(stranger) =', await Poll.isAgent(stranger));

// non-holder cannot create
let reverted = false;
try { await Poll.connect(other).createPoll('Q?', ['A', 'B'], 3600); } catch { reverted = true; }
console.log('non-holder createPoll reverts:', reverted);

// holder creates a poll
const tx = await Poll.createPoll('Best chain for agents?', ['BNB Chain', 'Ethereum', 'Solana'], 7 * 24 * 3600);
await tx.wait();
console.log('pollCount =', (await Poll.pollCount()).toString());

// holder votes
await (await Poll.vote(0, 0)).wait();
const p = await Poll.getPoll(0);
console.log('question:', p.question, '| counts:', p.counts.map(x => x.toString()).join(','), '| total:', p.totalVotes.toString());
console.log('hasVoted(me) =', await Poll.hasVoted(0, me), '| choiceOf =', (await Poll.choiceOf(0, me)).toString());

// double vote reverts
reverted = false;
try { await Poll.vote(0, 1); } catch { reverted = true; }
console.log('double vote reverts:', reverted);

// non-holder vote reverts
reverted = false;
try { await Poll.connect(other).vote(0, 1); } catch { reverted = true; }
console.log('non-holder vote reverts:', reverted);

// bad option reverts
await Mock.setHolder(stranger, 1);
reverted = false;
try { await Poll.connect(other).vote(0, 9); } catch { reverted = true; }
console.log('bad option reverts:', reverted);

// second holder votes fine
await (await Poll.connect(other).vote(0, 0)).wait();
const p2 = await Poll.getPoll(0);
console.log('after 2nd vote counts:', p2.counts.map(x => x.toString()).join(','), '| total:', p2.totalVotes.toString());
console.log('ALL TESTS DONE');
