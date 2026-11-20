// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal surface of the SPACE ID Agent ID contract (ERC-721).
///         AgentPoll only ever READS balances — it never transfers,
///         approves, or holds any asset.
interface IAgentID {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title AgentPoll
/// @notice On-chain polls exclusively for Agent ID holders. Holding an
///         Agent ID (a name.ai identity NFT) is the one and only
///         credential: only holders can create polls, and only holders
///         can vote — one address, one vote per poll.
/// @dev This contract holds NO user funds, has NO transfer/trade/approval
///      functions for user assets, and has NO owner/admin functions at
///      all. The Agent ID contract address is fixed at deployment
///      (immutable).
contract AgentPoll {
    /// @notice The official Agent ID contract on BNB Chain
    ///         (0x60b9262456de011f7d15a54cdd8c48baaa8b022f on mainnet).
    IAgentID public immutable agentId;

    struct Poll {
        address creator;
        string question;
        string[] options;
        uint256[] counts;
        uint256 deadline;
        uint256 totalVotes;
    }

    Poll[] private _polls;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    mapping(uint256 => mapping(address => uint256)) private _choiceOf;

    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string question,
        uint256 deadline
    );
    event Voted(
        uint256 indexed pollId,
        address indexed voter,
        uint256 optionIndex
    );

    constructor(address agentIdAddress) {
        require(agentIdAddress != address(0), "AgentPoll: zero address");
        agentId = IAgentID(agentIdAddress);
    }

    /// @notice True if `account` currently holds at least one Agent ID.
    function isAgent(address account) public view returns (bool) {
        return agentId.balanceOf(account) > 0;
    }

    modifier onlyAgent() {
        require(
            isAgent(msg.sender),
            "AgentPoll: caller does not hold an Agent ID"
        );
        _;
    }

    /// @notice Create a poll. Agent ID holders only.
    /// @param question        The poll question (non-empty).
    /// @param options         2 to 8 answer options (each non-empty).
    /// @param durationSeconds Voting window: 1 hour to 30 days.
    /// @return pollId         The id of the newly created poll.
    function createPoll(
        string calldata question,
        string[] calldata options,
        uint256 durationSeconds
    ) external onlyAgent returns (uint256 pollId) {
        require(bytes(question).length > 0, "AgentPoll: empty question");
        require(
            options.length >= 2 && options.length <= 8,
            "AgentPoll: need 2-8 options"
        );
        require(
            durationSeconds >= 1 hours && durationSeconds <= 30 days,
            "AgentPoll: duration 1h-30d"
        );

        pollId = _polls.length;
        Poll storage p = _polls.push();
        p.creator = msg.sender;
        p.question = question;
        p.deadline = block.timestamp + durationSeconds;
        for (uint256 i = 0; i < options.length; i++) {
            require(bytes(options[i]).length > 0, "AgentPoll: empty option");
            p.options.push(options[i]);
            p.counts.push(0);
        }

        emit PollCreated(pollId, msg.sender, question, p.deadline);
    }

    /// @notice Vote on an open poll. One vote per Agent ID address.
    function vote(uint256 pollId, uint256 optionIndex) external onlyAgent {
        require(pollId < _polls.length, "AgentPoll: no such poll");
        Poll storage p = _polls[pollId];
        require(block.timestamp < p.deadline, "AgentPoll: poll closed");
        require(optionIndex < p.options.length, "AgentPoll: bad option");
        require(!_hasVoted[pollId][msg.sender], "AgentPoll: already voted");

        _hasVoted[pollId][msg.sender] = true;
        _choiceOf[pollId][msg.sender] = optionIndex;
        p.counts[optionIndex] += 1;
        p.totalVotes += 1;

        emit Voted(pollId, msg.sender, optionIndex);
    }

    /// @notice Total number of polls ever created.
    function pollCount() external view returns (uint256) {
        return _polls.length;
    }

    /// @notice Full contents of one poll, including live vote counts.
    function getPoll(
        uint256 pollId
    )
        external
        view
        returns (
            address creator,
            string memory question,
            string[] memory options,
            uint256[] memory counts,
            uint256 deadline,
            uint256 totalVotes
        )
    {
        require(pollId < _polls.length, "AgentPoll: no such poll");
        Poll storage p = _polls[pollId];
        return (
            p.creator,
            p.question,
            p.options,
            p.counts,
            p.deadline,
            p.totalVotes
        );
    }

    /// @notice Whether `account` has already voted on `pollId`.
    function hasVoted(
        uint256 pollId,
        address account
    ) external view returns (bool) {
        return _hasVoted[pollId][account];
    }

    /// @notice The option index `account` chose on `pollId`.
    function choiceOf(
        uint256 pollId,
        address account
    ) external view returns (uint256) {
        require(_hasVoted[pollId][account], "AgentPoll: not voted");
        return _choiceOf[pollId][account];
    }
}
