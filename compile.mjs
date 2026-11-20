import solc from 'solc';
import fs from 'node:fs';

const source = fs.readFileSync('contracts/AgentPoll.sol', 'utf8');
const input = {
  language: 'Solidity',
  sources: { 'contracts/AgentPoll.sol': { content: source } },
  settings: {
    optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai',
    metadata: { useLiteralContent: true },
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'metadata'] } }
  }
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (out.errors || []).filter(e => e.severity === 'error');
if (errors.length) { console.error(errors.map(e => e.formattedMessage).join('\n')); process.exit(1); }
(out.errors || []).forEach(e => console.warn('WARN:', e.formattedMessage));
const c = out.contracts['contracts/AgentPoll.sol']['AgentPoll'];
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync('build/AgentPoll.json', JSON.stringify({ abi: c.abi, bytecode: '0x' + c.evm.bytecode.object, metadata: c.metadata }, null, 2));
console.log('compiled OK. bytecode bytes:', c.evm.bytecode.object.length / 2);
console.log('solc version:', solc.version());
