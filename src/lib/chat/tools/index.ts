/**
 * Side-effect imports register every tool exactly once (guarded by
 * `registerTool` in ./types). Import this module (not the individual tool
 * files) anywhere the full registry is needed — the orchestrator, tests,
 * etc. — so the set of available tools always comes from one place.
 */
import "./tasks";
import "./schedule";
import "./school";
import "./recruiting";
import "./documents";
import "./memory";
import "./actions";
import "./search";

export {
  getRegisteredTool,
  listRegisteredTools,
  listToolDeclarations,
  type ChatTool,
  type ToolContext,
  type DataTier,
} from "./types";
