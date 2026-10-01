// workspace/PanelRegistry.ts
// Maps PanelType strings → React components.
// Adding a new panel to the platform = one line here.
// WorkspaceManager never imports panels directly — always goes through this registry.

import React from 'react';
import type { PanelType } from './types';

import { PriceBook }           from '../panels/BookPanel/PriceBook';
import { BrokerHistory }       from '../panels/BrokerHistoryPanel/BrokerHistory';
import { TimesAndTrades }       from '../panels/TimesTradesPanel/TimesAndTrades';
import { SuperDOM }            from '../panels/SuperDOMPanel/SuperDOM';
import { VolumeProfile }       from '../panels/VolumeProfilePanel/VolumeProfile';
import { AtemporalChart }      from '../panels/Chart8PPanel/AtemporalChart';
import { OrderBookByBroker }   from '../panels/OrderBookByBrokerPanel/OrderBookByBroker';
import { PriceLadder }         from '../panels/PriceLadderPanel/PriceLadder';
import { CandleClock }         from '../panels/CandleClockPanel/CandleClock';
import { TrainingPanel }       from '../panels/TrainingPanel/TrainingPanel';
import { DebugPanel }          from '../panels/DebugPanel/DebugPanel';
import { TrainingHUD }         from '../panels/TrainingHUD/TrainingHUD';
import { ReplayToolbar }       from '../panels/ReplayToolbar/ReplayToolbar';
import { LargeTrades }         from '../panels/LargeTradesPanel/LargeTrades';
import { MediumTrades }        from '../panels/LargeTradesPanel/MediumTrades';
import { ScenarioEditor }     from '../panels/ScenarioEditorPanel/ScenarioEditor';
import { TradeHistory }       from '../panels/TradeHistoryPanel/TradeHistory';
import { ScenarioInspector } from '../panels/ScenarioInspectorPanel/ScenarioInspector';
import { MissionInspector } from '../panels/MissionInspectorPanel/MissionInspector';
import { EvaluationInspector } from '../panels/EvaluationInspectorPanel/EvaluationInspector';
import { FeedbackInspector } from '../panels/FeedbackInspectorPanel/FeedbackInspector';
import { ReplayInspector } from '../panels/ReplayInspectorPanel/ReplayInspector';
import { ReplayPlayer } from '../panels/ReplayPlayerPanel/ReplayPlayer';
import { DataPanel } from '../panels/DataPanel/DataPanel';

export const PANEL_REGISTRY: Record<PanelType, React.ComponentType<any>> = {
  BookPanel:              PriceBook,
  BrokerHistoryPanel:     BrokerHistory,
  TimesTradesPanel:       TimesAndTrades,
  SuperDOMPanel:          SuperDOM,
  VolumeProfilePanel:     VolumeProfile,
  Chart8PPanel:           AtemporalChart,
  OrderBookByBrokerPanel: OrderBookByBroker,
  PriceLadderPanel:       PriceLadder,
  CandleClockPanel:       CandleClock,
  TrainingPanel:          TrainingPanel,
  DebugPanel:             DebugPanel,
  TrainingHUD:            TrainingHUD,
  ReplayToolbar:          ReplayToolbar,
  LargeTradesPanel:       LargeTrades,
  MediumTradesPanel:      MediumTrades,
  ScenarioEditorPanel:    ScenarioEditor,
  TradeHistoryPanel:      TradeHistory,
  ScenarioInspectorPanel: ScenarioInspector,
  MissionInspectorPanel:  MissionInspector,
  EvaluationInspectorPanel: EvaluationInspector,
  FeedbackInspectorPanel: FeedbackInspector,
  ReplayInspectorPanel:  ReplayInspector,
  ReplayPlayerPanel:     ReplayPlayer,
  DataPanel:             DataPanel,
};

/** Resolve a panel component by type. Returns null if not found (safe). */
export function resolvePanel(type: PanelType): React.ComponentType<any> | null {
  return PANEL_REGISTRY[type] ?? null;
}
