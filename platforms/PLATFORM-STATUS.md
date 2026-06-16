# NTV Platform Status

## Summary
This document tracks the implementation status of nTV across different TV platforms. Per the TV platform decisions doc (T-P3-E4-W1-S2-T02), Roku, Tizen, and WebOS do not have React Native TV equivalents, so the decision is to keep or retire native implementations based on functional completeness.

## Platform Status

| Platform | LOC | Decision | Rationale |
|----------|-----|----------|-----------|
| Roku (BrightScript) | 0 | RETIRE | No implementation exists; directory is empty. Roku support deferred pending demand. |
| Tizen (HTML-JS) | 0 | RETIRE | No implementation exists; directory is empty. Tizen support deferred pending demand. |
| WebOS (HTML-JS) | 0 | RETIRE | No implementation exists; directory is empty. WebOS support deferred pending demand. |

## Decision Framework

- **KEEP_NATIVE**: Implementation exists with >100 LOC and is functionally complete
- **RETIRE**: No implementation or stub placeholder (<100 LOC)
- **DEPRECATED**: Formerly KEEP but marked for future removal

## Next Steps

Once Roku, Tizen, or WebOS support becomes a priority, implementations can be created in their respective platform directories. The primary focus remains on tvOS (via React Native for Apple TV) and Android TV (via React Native for TV).
