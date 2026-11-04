import React from "react";
import { Composition } from "remotion";
import { Reel, REEL_DURATION, FPS } from "./Reel";

export const Root: React.FC = () => <Composition id="Reel" component={Reel} durationInFrames={REEL_DURATION} fps={FPS} width={1920} height={1080} />;
