// Fine-grained GitHub token, scoped to ONLY this repo with "Contents: Read and write"
// permission and nothing else. Create one at:
// https://github.com/settings/personal-access-tokens/new
//
// Heads up: this file ships to every visitor's browser, so this token IS visible to
// anyone who opens dev tools. Keep its scope limited to this single repo's contents
// (never grant it broader access) so the worst case is someone edits signups.json.
//
// Until a token is set below, the page falls back to this-device-only storage.

const GITHUB_CONFIG = {
  owner: "karlsoderby",
  repo: "signup-bg",
  branch: "main",
  path: "signups.json",
  token: "", // paste token here, e.g. "github_pat_..."
};
