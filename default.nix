{ pkgs, ... }:
let
  inherit (pkgs) yarn2nix-moretea;
  inherit (yarn2nix-moretea) mkYarnPackage linkNodeModulesHook;

  isSource = false;
in
mkYarnPackage rec {
  name = "billet";
  src = ./.;
  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./yarn.nix;
  dontStrip = true;
}
