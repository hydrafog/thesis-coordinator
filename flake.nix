{
  description = "Development environment for Thesis Coordinator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            pnpm
            python3
            python3Packages.pip
            git
            gh
            postgresql_16
            docker
            docker-compose
            typst
            cloudflared
            stdenv.cc.cc.lib
          ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ];

          shellHook = ''
            echo "Thesis Coordinator development shell"
            echo "Node: $(node --version)"
            echo "pnpm: $(pnpm --version)"
            echo "Typst: $(typst --version)"
          '';
        };
      });
}
