/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

goog.provide('blk.physics.ServerMovement');

goog.require('blk.env.EntityState');
goog.require('blk.physics.Movement');



/**
 * Server-side movement utility.
 *
 * @constructor
 * @extends {blk.physics.Movement}
 * @param {!blk.env.ChunkView} view Chunk view.
 */
blk.physics.ServerMovement = function(view) {
  goog.base(this, view);

  /**
   * Move commands received and waiting to be processed.
   * @private
   * @type {!Array.<!blk.physics.MoveCommand>}
   */
  this.pendingCommands_ = [];

  /**
   * Last confirmed sequence ID.
   * @type {number}
   */
  this.lastSequence = -1;
};
goog.inherits(blk.physics.ServerMovement, blk.physics.Movement);


/**
 * Queues a batch of move commands.
 * @param {!Array.<!blk.physics.MoveCommand>} commands Move commands.
 */
blk.physics.ServerMovement.prototype.queueCommands = function(commands) {
  this.pendingCommands_.push.apply(this.pendingCommands_, commands);
};


/**
 * Updates the controller during the simulation loop.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.physics.ServerMovement.prototype.update = function(frame) {
  // Ignore if not attached
  if (!this.target) {
    this.pendingCommands_.length = 0;
    return;
  }

  var originalState = blk.physics.ServerMovement.tmpState_;
  originalState.setFromState(this.target.state);

  // Execute all commands in order
  var commands = this.pendingCommands_;
  if (commands.length) {
    // TODO(benvanik): magic with time to place the user command at the time it
    // was executed relative to the current sim time
    // This is needed to ensure collision detection and actions occur in the
    // proper state
    //
    // I'm not sure how to do this yet without keeping a sliding window of
    // previous block states (old -> new) so that the world state can be
    // rewound
    //
    // This logic only needs to happen on the server side, and if we rewind the
    // world to the time of the first cmd in `commands` we can play through
    // at the same rate.
    // So we need:
    // - MapEvent[]
    //   - time
    //   - xyz
    //   - type: set block, action (changing state, etc?)
    //   - old/new block data, etc
    //
    // Then we can find the time of the commands in the array w/ binary search
    // and step through the array as we step through commands:
    // -- world is in server state (up to date)
    // var eventIndex = bsearch(history, first_command.time)
    // for eventIndex to 0 in history as e:
    //    unapply e
    // for each command:
    //     while !event.time < command.time as e:
    //        apply e
    //     execute command
    //        if action:
    //          queue history event to scratch list
    // for each remaining event e:
    //    apply e
    // sorted insert scratch list in history
    // -- world should now match what it did at the start (up to date, plus
    //    any deltas made by the user commands)
    //
    // History actions will need to take user actions into account - for example
    // if the user has an action that modifies a block from A to B, if there is
    // a later history event that is supposed to modify it from A to C, some
    // conflict resolution must occur. Either the block could be always forced
    // to C (last-actor in simulation time wins), or some more complex logic
    // could be used.
    //
    // All modifications to the world need to go through the history, including
    // server-side modifications such as scheduled updates (grass growing/etc).
    // The 'history' should probably live outside of blk.physics and in
    // the ServerMap instance.

    for (var n = 0; n < commands.length; n++) {
      var cmd = commands[n];
      cmd.havePredicted = false;
      this.executeCommand(frame.time / 1000, cmd);

      this.lastSequence = cmd.sequence;
    }

    // Reset
    this.pendingCommands_.length = 0;
  }

  // See if any significant change worth resending to clients
  if (!originalState.equals(this.target.state)) {
    this.target.hasSentLatestState = false;
  }
};


/**
 * Temporary state for diff tracking.
 * @private
 * @type {!blk.env.EntityState}
 */
blk.physics.ServerMovement.tmpState_ = new blk.env.EntityState();
