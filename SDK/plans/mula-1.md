# MULA-1: Standing up a reinforcement learning pipeline

## System state transition declaration

Before: SmartScroll & TopShelf randomize results in the product feed before rendering to the end user.

After: SmartScroll & TopShelf will leverage the output of a reinforcement learning system designed to intentionally select the feed order in an effort to optimize toward a goal.

## Necessary parts

1. Training data
2. Feed order file
3. Alterations to the SDK (maybe SmartScroll & TopShelf, themselves) to make use of the feed order file

### Training Data

We'd like the set of mula_in_view events over all time.

We'd like the set of feed_click events over all time.

We'd like to wisely transform those events into a training file that can be consumed by Vowpal Wabbit.

* How should we group them? By Session ID?

## Feed order file

We'd like Vowpal Wabbit to output a feed order file. Pass in a feed identifier and get back a recommended order?