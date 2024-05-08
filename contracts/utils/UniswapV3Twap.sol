//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UniswapV3Twap {
    address public immutable token0;
    address public immutable token1;
    address public immutable pool;

    constructor(
        address _factory,
        address _token0,
        address _token1,
        uint24 _fee
    ) {
        token0 = _token0;
        token1 = _token1;

        address _pool = IUniswapV3Factory(_factory).getPool(
            _token0,
            _token1,
            _fee
        );
        // require(_pool != address(0), "pool doesn't exist");

        pool = _pool;
    }

    function estimateAmountOut(
        address tokenIn,
        uint128 amountIn,
        uint32 secondsAgo
    ) internal view returns (uint amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "invalid token");

        address tokenOut = tokenIn == token0 ? token1 : token0;

        // (int24 tick, ) = OracleLibrary.consult(pool, secondsAgo);

        // Code copied from OracleLibrary.sol, consult()
        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = secondsAgo;
        secondsAgos[1] = 0;

        // int56 since tick * time = int24 * uint32
        // 56 = 24 + 32
        (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(
            secondsAgos
        );

        int56 tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0];

        // int56 / uint32 = int24
        int24 tick = int24(tickCumulativesDelta / int32(secondsAgo));
        // Always round to negative infinity
        /*
        int doesn't round down when it is negative

        int56 a = -3
        -3 / 10 = -3.3333... so round down to -4
        but we get
        a / 10 = -3

        so if tickCumulativeDelta < 0 and division has remainder, then round
        down
        */
        if (
            tickCumulativesDelta < 0 &&
            (tickCumulativesDelta % int32(secondsAgo) != 0)
        ) {
            tick--;
        }

        amountOut = OracleLibrary.getQuoteAtTick(
            tick,
            amountIn,
            tokenIn,
            tokenOut
        );
    }

    function callEstimateAmountOut(
        IERC20 _tokenIn,
        uint128 _amountIn,
        uint32 _secondsAgo
    ) public view returns (uint amountOut) {
        return estimateAmountOut(address(_tokenIn), _amountIn, _secondsAgo);
    }

    function priceOfOneMMLInUSDT(
        uint price
    ) public pure returns (uint amountOut) {
        return 445188 * price;
    }

    function priceOfOneUSDTinMML(
        uint price
    ) public pure returns (uint amountOut) {
        return 2246238172973155145 * price;
    }
}
