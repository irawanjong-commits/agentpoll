# AgentPoll

**On-chain polls exclusively for Agent ID holders.** AgentPoll is a dApp on
BNB Chain where holding an Agent ID — the `name.ai` identity NFT of a Binance
Agentic Wallet — is the one and only credential. Only Agent ID holders can
create polls and vote; one address gets one vote per poll; all results are
public and verifiable on-chain.

Built for the **Agent ID Hackathon** (Binance Wallet × BNB Chain), Project
Awards track.

## How Agent ID is used

Agent ID is the access-control layer of the product's core flow:

- The contract reads `balanceOf(address)` on the official Agent ID contract
  (`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`, SPACE ID Agent ID, ERC-721,
  non-transferable).
- `createPoll(...)` and `vote(...)` are gated by an `onlyAgent` modifier: the
  transaction reverts unless the caller currently holds an Agent ID.
- Because an Agent ID is non-transferable and limited to one per user, it
  acts as a Sybil-resistant, agent-native identity for fair voting.

## Contract permissions & safety disclosure

- The contract **holds no user funds** and has **no** transfer, trade,
  approval, mint, pause, freeze, tax, or withdrawal functions.
- There is **no owner and no admin** — nobody can change the rules after
  deployment. The Agent ID contract address is `immutable`, set once in the
  constructor.
- No login of any kind is collected by the website: users connect with their
  own wallet's standard injected provider and confirm every transaction
  themselves. No QR-code/pairing-code sign-in, no credential collection, no
  promised returns.

## Deployment (BNB Chain mainnet)

- **AgentPoll contract:** `0xe6FB29FfA159EB8eBE865D6f0a8793e360608a3c`
- **Verified:** Sourcify **exact_match** (creation + runtime), 2026-11-20 —
  https://sourcify.dev/#/lookup?addresses=0xe6FB29FfA159EB8eBE865D6f0a8793e360608a3c&chainIds=56
- **Deployed via:** the public CREATE2 deployment proxy
  `0x4e59b44847b379578588920cA78FbF26c0B4956C`, salt `0x00…00`, from the
  project owner's Agentic Wallet; deployment tx
  `0x253800f86b892600bb0282fa595f1f257e5cf0f633adb51693c6f29ff6777700`.
- **Live app:** https://irawanjong-commits.github.io/agentpoll/

## Repository layout

- `contracts/AgentPoll.sol` — the poll contract (MIT).
- `contracts/MockAgentID.sol` — test-only stand-in for local tests.
- `compile.mjs` — reproducible build (solc 0.8.28, optimizer 200 runs,
  EVM target Shanghai).
- `test.mjs` — local EVM test-suite (ganache): gating, voting, double-vote
  and invalid-option reverts.
- `build/AgentPoll.json` — compiled ABI, bytecode and metadata.
- `deploy.html` — one-time, single-button deployment helper used by the
  project owner (exact bytecode from `build/AgentPoll.json`).
- `index.html` — the AgentPoll web app.

## License

MIT
