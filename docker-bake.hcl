// Docker Bake — matrix build for Node + Bun variants
// Usage: docker buildx bake            (build all locally)
//        docker buildx bake --push     (push to registry)

group "default" {
  targets = ["node", "bun"]
}

// ─── Node variant (default, tagged as :latest) ───────────────────────────
target "node" {
  dockerfile = "Dockerfile"
  target = "runner"
  args = {
    RUNTIME = "node"
  }
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "hansputera/9router-fork:latest",
    "hansputera/9router-fork:node-latest",
  ]
}

// ─── Bun variant (tagged as :bun-latest) ────────────────────────────────
target "bun" {
  dockerfile = "Dockerfile"
  target = "runner"
  args = {
    RUNTIME = "bun"
  }
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "hansputera/9router-fork:bun-latest",
  ]
}

// ─── Versioned tags (used in CI when a git tag is pushed) ────────────────
target "node-versioned" {
  inherits = ["node"]
  tags = [
    "hansputera/9router-fork:${TAG}",
    "hansputera/9router-fork:node-${TAG}",
  ]
}

target "bun-versioned" {
  inherits = ["bun"]
  tags = [
    "hansputera/9router-fork:bun-${TAG}",
  ]
}

group "versioned" {
  targets = ["node-versioned", "bun-versioned"]
}
