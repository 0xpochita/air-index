"use client";

import { useMemo, useState } from "react";
import {
  applyRouteCost,
  getUnitPriceUsd,
  quoteAssetToUnits,
  unitsToQuoteAsset,
  unitsToUnits,
} from "@/lib/index-math";
import { getDefaultQuoteAsset, getIndexUnitBalance } from "@/lib/mock/quotes";
import type {
  IndexFund,
  QuoteAsset,
  SwapMode,
  SwapRoute,
} from "@/types/index-fund";

const AMOUNT_PATTERN = /^\d*\.?\d*$/;

export interface SwapSide {
  symbol: string;
  amount: number;
  balance: number;
  valueUsd: number;
}

interface UseSwapFormOptions {
  index: IndexFund;
  alternateIndex: IndexFund;
}

const parseAmount = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIndexSymbol = (index: IndexFund): string =>
  (index.ticker ?? index.slug).toUpperCase();

export const useSwapForm = ({ index, alternateIndex }: UseSwapFormOptions) => {
  const [mode, setMode] = useState<SwapMode>("deposit");
  const [route, setRoute] = useState<SwapRoute>("direct");
  const [amountInput, setAmountInput] = useState("");
  const [quoteAsset, setQuoteAsset] =
    useState<QuoteAsset>(getDefaultQuoteAsset);

  const amount = parseAmount(amountInput);
  const unitPriceUsd = getUnitPriceUsd(index);
  const indexBalance = getIndexUnitBalance(index.slug);
  const indexSymbol = toIndexSymbol(index);
  const alternateSymbol = toIndexSymbol(alternateIndex);

  const receivedAmount = useMemo(() => {
    if (mode === "deposit") {
      return applyRouteCost(
        quoteAssetToUnits(amount, quoteAsset, index),
        route,
      );
    }
    if (mode === "redeem") {
      return applyRouteCost(
        unitsToQuoteAsset(amount, index, quoteAsset),
        route,
      );
    }
    return applyRouteCost(unitsToUnits(amount, index, alternateIndex), route);
  }, [alternateIndex, amount, index, mode, quoteAsset, route]);

  const payment: SwapSide =
    mode === "deposit"
      ? {
          symbol: quoteAsset.token.symbol.toUpperCase(),
          amount,
          balance: quoteAsset.balance,
          valueUsd: amount * quoteAsset.priceUsd,
        }
      : {
          symbol: indexSymbol,
          amount,
          balance: indexBalance,
          valueUsd: amount * unitPriceUsd,
        };

  const receipt: SwapSide =
    mode === "redeem"
      ? {
          symbol: quoteAsset.token.symbol.toUpperCase(),
          amount: receivedAmount,
          balance: quoteAsset.balance,
          valueUsd: receivedAmount * quoteAsset.priceUsd,
        }
      : {
          symbol: mode === "deposit" ? indexSymbol : alternateSymbol,
          amount: receivedAmount,
          balance:
            mode === "deposit"
              ? indexBalance
              : getIndexUnitBalance(alternateIndex.slug),
          valueUsd:
            receivedAmount *
            (mode === "deposit"
              ? unitPriceUsd
              : getUnitPriceUsd(alternateIndex)),
        };

  const previewRate = useMemo(() => {
    if (mode === "deposit") {
      return applyRouteCost(quoteAssetToUnits(1, quoteAsset, index), route);
    }
    if (mode === "redeem") {
      return applyRouteCost(unitsToQuoteAsset(1, index, quoteAsset), route);
    }
    return applyRouteCost(unitsToUnits(1, index, alternateIndex), route);
  }, [alternateIndex, index, mode, quoteAsset, route]);

  const changeAmount = (value: string) => {
    if (AMOUNT_PATTERN.test(value)) {
      setAmountInput(value);
    }
  };

  const setMaxAmount = () => setAmountInput(String(payment.balance));

  const changeMode = (nextMode: SwapMode) => {
    setMode(nextMode);
    setAmountInput("");
  };

  return {
    mode,
    route,
    amountInput,
    quoteAsset,
    payment,
    receipt,
    unitPriceUsd,
    previewRate,
    indexSymbol,
    alternateSymbol,
    hasAmount: amount > 0,
    isOverBalance: amount > payment.balance,
    changeMode,
    changeAmount,
    setMaxAmount,
    setRoute,
    setQuoteAsset,
  };
};
