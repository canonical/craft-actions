import * as setup from "@craft-actions/common/setup-action.ts";

if (import.meta.url === `file://${process.argv[1]}`) {
  void setup.runSetupAction("charmcraft");
}
