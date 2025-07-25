# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript + PIXI.js + Vite game engine project focused on modular design and test-driven development (TDD). The engine follows a Game/Scene/Actor architecture pattern with comprehensive mock implementations for testing.

**Key Architecture**: Game manages time/input/scenes, Scenes contain state logic and manage Actors, Actors represent individual game elements (players, enemies, mechanics).

**Testing Philosophy**: Emphasizes separation of rendering and logic, state predictability, injectability, and observability using frame-based control and testing.

## Development Commands

### Build & Run

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run preview     # Preview production build
```

### Code Quality

Always run these after making changes:
```bash
npm run lint        # Run linter (if configured)
npm run typecheck   # TypeScript type checking (if configured)
```

## Technology Stack

- **Frontend**: TypeScript, PIXI.js 8.10.2
- **Build Tool**: Vite 7.0.0  
- **Package Manager**: npm
- **Testing Framework**: Jest (planned)

## Development Methodology

**Test-Driven Development (TDD)**: Follow TDD principles for all development:

1. Write a failing test first (Red)
2. Write the minimum code to make the test pass (Green)  
3. Refactor while keeping tests passing (Refactor)

**Mock-First Engine Development**: Use MockGame and MockInput for engine development testing to eliminate PIXI dependencies and enable frame-based testing.

## Project Structure

### Main Development Areas

- **Primary Development**: Use files in `src/engine/` directory
- **Legacy Code**: `src/engine.ts` is kept for compatibility only - DO NOT update
- **New Features**: Must be developed within `src/engine/` directory

### Import Guidelines

```typescript
// Engine usage (for creating games/examples)
import { Game, Scene, Actor } from "./engine";

// Engine development (for testing engine itself)
import { MockGame, MockInput } from "./__mocks__";

// ⚠️ Legacy (compatibility only - do not use for new development)
import { Game } from "./engine_old";
```

## Architecture Guidelines

### Core Classes

- **Game**: Thin control layer managing time, input, and scenes
- **Scene**: Main state logic container, manages collection of Actors
- **Actor**: Base class for game elements (players, enemies, mechanics)
  - **ParticleActor**: Specialized for particle effects
  - **PhysicsActor**: Abstract class for physics-enabled entities

### Input System

The Input class uses numeric state management:
- `0`: Unused
- `1+`: Pressed (1=just pressed, 2+=continued)
- `-1-`: Released (-1=just released, -2-=continued)

Key methods: `isKeyPressed()`, `isKeyJustPressed()`, `isKeyJustReleased()`, `getMousePosition()`

## Development Strategy

### Engine Examples and Demos

The `src/test/` directory contains practical examples of games and features built using the engine:
- `test01.ts` through `test06.ts` are runnable examples demonstrating engine capabilities
- Each example has a corresponding `testXX.html` file for browser execution
- These serve as both feature demonstrations and integration tests for the engine

### Engine Development Testing

For engine development itself, use mock classes to eliminate PIXI dependencies:

**MockGame Features**:
- PIXI dependency elimination
- Test-specific properties (updateCallCount, etc.)
- Dummy texture loading for lightweight asset handling

**MockInput Features**:
- Frame-based input scheduling
- Immediate state change methods
- Debug state inspection capabilities

### Engine Testing Requirements

1. Use MockGame and MockInput for engine development testing
2. Execute tests in frame-based increments
3. Prioritize state observability
4. Eliminate side effects

## Development Process

### File Organization

- `*.ts`: TypeScript source files
- `*.mock.ts`: Engine development mock implementations
- `test*.ts`: Engine usage examples and feature demonstrations
- `index.ts`: Export aggregation files
- `testXX.html`: Browser execution pages for examples

### Error Handling Requirements

- Canvas element existence verification
- Asset loading failure handling
- Proper input event processing

## Implementation Guidelines

### When Adding Engine Features

1. **Test First**: Write failing tests using MockGame/MockInput
2. **Minimal Implementation**: Write minimum code to pass tests
3. **Refactor**: Clean up while maintaining test coverage
4. **Integration**: Ensure compatibility with existing Game/Scene/Actor pattern
5. **Example Creation**: Create practical examples in `src/test/` to demonstrate new features
6. **Documentation**: Update inline documentation as needed

### When Creating Examples/Games

1. **Use Engine**: Import from `./engine` for all game logic
2. **Follow Patterns**: Use established Game/Scene/Actor architecture
3. **Create HTML**: Add corresponding `testXX.html` file for browser execution
4. **Demonstrate Features**: Focus on showcasing specific engine capabilities

### Code Quality Standards

- Follow existing TypeScript conventions
- Maintain separation between rendering and logic
- Use frame-based testing approach
- Ensure state predictability and observability
- Keep PIXI dependencies isolated from core logic

### Current Development Status

The project uses a modular engine architecture with comprehensive mocking for testability. Main development should focus on the `src/engine/` directory while maintaining the established Game/Scene/Actor pattern.

## Notes

- The `summary/` directory contains design documentation and development history
- Test pages (test0X.html) are available for manual testing
- All new development must follow the established architectural patterns
- Legacy engine.ts file should not be modified - use engine/ directory instead