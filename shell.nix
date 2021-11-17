{ nixpkgs ? import ./z/etc/lib/nixpkgs.nix
}:
let
  inherit (nixpkgs) pkgs;
  inherit (pkgs) mkShell callPackage;

  pname = "billet-devenv";
  version = "0.1.0";

  yarnPkg = (callPackage ./default.nix { inherit pkgs; });
in mkShell {
  name = "${pname}-${version}";
  src = builtins.filterSource
    (path: type: (type == "directory" && baseNameOf path == "z"))
    ./.;

  nativeBuildInputs = with pkgs; [
    nodejs
    yarn2nix
    yarnPkg
  ];

  shellHook = ''
    export NODE_PATH=${yarnPkg.node_modules}:$NODE_PATH
    export PATH=${yarnPkg.node_modules}/.bin:$PATH
  '';
}
