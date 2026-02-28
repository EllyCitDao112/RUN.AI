// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MusicPilotPlatform is ERC721, Ownable {
    enum Role {
        None,
        Artist,
        User,
        Merchant
    }

    struct Subscription {
        uint8 tier;
        uint64 expiry;
    }

    struct Track {
        address artist;
        string title;
        string metadataUri;
        string coverUri;
        string audioUri;
        uint256 licensePrice;
        uint64 createdAt;
    }

    struct CpmReport {
        uint64 periodStart;
        uint64 periodEnd;
        uint256 cpm;
        string notes;
        uint64 postedAt;
        address poster;
    }

    uint256 public nextTrackId;
    uint256 public nextTokenId;
    address public oracle;

    mapping(bytes32 => uint256) public subscriptionPricePerDay;
    mapping(address => mapping(Role => Subscription)) public subscriptions;
    mapping(uint256 => Track) public tracks;
    mapping(uint256 => mapping(address => bool)) public hasTrackLicense;
    mapping(uint256 => uint256) public tokenToTrackId;
    mapping(uint256 => CpmReport[]) private cpmReports;

    event SubscriptionPurchased(address indexed account, Role indexed role, uint8 tier, uint64 expiry, uint256 amountPaid);
    event TrackRegistered(uint256 indexed trackId, address indexed artist, string title, uint256 licensePrice, string metadataUri);
    event LicensePurchased(uint256 indexed trackId, uint256 indexed tokenId, address indexed buyer, uint256 amountPaid);
    event CpmReportPosted(uint256 indexed trackId, uint64 periodStart, uint64 periodEnd, uint256 cpm, address indexed poster);
    event OracleUpdated(address indexed oracle);

    constructor(address initialOwner) ERC721("Music Pilot License", "MPL") Ownable(initialOwner) {}

    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    function setSubscriptionPricePerDay(Role role, uint8 tier, uint256 weiPerDay) external onlyOwner {
        require(role != Role.None, "invalid role");
        require(tier > 0, "invalid tier");
        subscriptionPricePerDay[_priceKey(role, tier)] = weiPerDay;
    }

    function subscribe(Role role, uint8 tier, uint64 durationDays) external payable {
        require(role != Role.None, "invalid role");
        require(tier > 0, "invalid tier");
        require(durationDays > 0, "invalid duration");

        uint256 totalPrice = subscriptionPricePerDay[_priceKey(role, tier)] * durationDays;
        require(totalPrice > 0, "price not set");
        require(msg.value == totalPrice, "incorrect payment");

        Subscription storage sub = subscriptions[msg.sender][role];
        uint64 base = sub.expiry > block.timestamp ? sub.expiry : uint64(block.timestamp);
        sub.tier = tier;
        sub.expiry = base + (durationDays * 1 days);

        emit SubscriptionPurchased(msg.sender, role, tier, sub.expiry, msg.value);
    }

    function registerTrack(
        string calldata title,
        string calldata metadataUri,
        string calldata coverUri,
        string calldata audioUri,
        uint256 licensePrice
    ) external returns (uint256 trackId) {
        require(_isActive(msg.sender, Role.Artist), "artist subscription required");
        require(bytes(metadataUri).length > 0, "metadata required");
        require(bytes(audioUri).length > 0, "audio required");

        trackId = nextTrackId++;
        tracks[trackId] = Track({
            artist: msg.sender,
            title: title,
            metadataUri: metadataUri,
            coverUri: coverUri,
            audioUri: audioUri,
            licensePrice: licensePrice,
            createdAt: uint64(block.timestamp)
        });

        emit TrackRegistered(trackId, msg.sender, title, licensePrice, metadataUri);
    }

    function purchaseLicense(uint256 trackId) external payable returns (uint256 tokenId) {
        Track memory t = tracks[trackId];
        require(t.artist != address(0), "track not found");
        require(msg.value == t.licensePrice, "incorrect payment");
        require(!hasTrackLicense[trackId][msg.sender], "already licensed");

        tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        hasTrackLicense[trackId][msg.sender] = true;
        tokenToTrackId[tokenId] = trackId;

        emit LicensePurchased(trackId, tokenId, msg.sender, msg.value);
    }

    function canDownload(address account, uint256 trackId) external view returns (bool) {
        return hasTrackLicense[trackId][account] || _isActive(account, Role.User);
    }

    function isCommerciallyActive(address account) external view returns (bool) {
        return _isActive(account, Role.Merchant);
    }

    function postCpmReport(
        uint256 trackId,
        uint64 periodStart,
        uint64 periodEnd,
        uint256 cpm,
        string calldata notes
    ) external {
        require(msg.sender == owner() || msg.sender == oracle, "not authorized");
        require(tracks[trackId].artist != address(0), "track not found");
        require(periodEnd >= periodStart, "invalid period");

        cpmReports[trackId].push(
            CpmReport({
                periodStart: periodStart,
                periodEnd: periodEnd,
                cpm: cpm,
                notes: notes,
                postedAt: uint64(block.timestamp),
                poster: msg.sender
            })
        );

        emit CpmReportPosted(trackId, periodStart, periodEnd, cpm, msg.sender);
    }

    function getCpmReports(uint256 trackId) external view returns (CpmReport[] memory) {
        return cpmReports[trackId];
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "invalid receiver");
        to.transfer(address(this).balance);
    }

    function _priceKey(Role role, uint8 tier) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(role, tier));
    }

    function _isActive(address account, Role role) private view returns (bool) {
        return subscriptions[account][role].expiry >= block.timestamp;
    }
}
