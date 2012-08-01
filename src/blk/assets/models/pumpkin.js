/**
 * Copyright 2012 Google Inc. All Rights Reserved.
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

/**
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('blk.assets.models.pumpkin');

goog.require('gf.mdl.ComponentType');
goog.require('gf.mdl.GeometryData');
goog.require('gf.mdl.Material');
goog.require('gf.mdl.Model');
goog.require('gf.mdl.PrimitiveType');
goog.require('gf.vec.BoundingBox');
goog.require('goog.vec.Vec4');


/**
 * Model ID.
 * @const
 * @type {string}
 */
blk.assets.models.pumpkin.ID = 'pumpkin';


/**
 * Creates the model.
 * @param {!gf.assets.AssetManager} assetManager Asset manager.
 * @return {blk.assets.models.Pumpkin} Model.
 */
blk.assets.models.pumpkin.create = function(assetManager) {
  var model = new gf.mdl.Model();
  blk.assets.models.pumpkin.buildModel(model);
  return model;
};


/**
 * Builds the model.
 * @param {!gf.mdl.Model} model Model to populate.
 */
blk.assets.models.pumpkin.buildModel = function(model) {
  // Set bounding volumes
  gf.vec.BoundingBox.setFromArray(
      model.boundingBox, [
        0, 0, 0,
        1, 2, 1
      ]);
  goog.vec.Vec4.setFromValues(
      model.boundingSphere,
      0, 1, 0, 1);

  // Setup geometry
  var geometryData = blk.assets.models.pumpkin.buildGeometryData_();
  model.setGeometryData(geometryData);

  // Define material
  var material = new gf.mdl.Material();
  // TODO(benvanik): material

  // Create parts
  var rootPart = model.createPart(material);
  rootPart.primitiveType = gf.mdl.PrimitiveType.TRIANGLES;
  rootPart.elementCount = 36;

  // Setup root bone
  var rootBone = model.createBone(null);
  gf.vec.BoundingBox.set(bone.boundingBox, model.boundingBox);
  goog.vec.Vec4.setFromArray(bone.boundingSphere, model.boundingSphere);
};


/**
 * Builds the model geometry data.
 * @private
 * @return {!gf.mdl.GeometryData} Geometry data.
 */
blk.assets.models.pumpkin.buildGeometryData_ = function() {
  // Grab texture coordinates
  var sideTexCoords = goog.vec.Vec4.createFloat32FromValues(
      96, 112, 96 + 16, 112 + 16);
  var faceTexCoords = goog.vec.Vec4.createFloat32FromValues(
      128, 112, 128 + 16, 112 + 16);
  var topTexCoords = goog.vec.Vec4.createFloat32FromValues(
      96, 96, 96 + 16, 96 + 16);
  goog.vec.Vec4.scale(sideTexCoords, 1 / 256, sideTexCoords);
  goog.vec.Vec4.scale(faceTexCoords, 1 / 256, faceTexCoords);
  goog.vec.Vec4.scale(topTexCoords, 1 / 256, topTexCoords);

  // Attributes, in XYZ NXYZ UV
  var attributeData = new Float32Array([
    // Front face (+Z)
    0, 0, 1, 0, 0, 1, sideTexCoords[2], sideTexCoords[3],
    1, 0, 1, 0, 0, 1, sideTexCoords[0], sideTexCoords[3],
    1, 2, 1, 0, 0, 1, sideTexCoords[0], sideTexCoords[1],
    0, 2, 1, 0, 0, 1, sideTexCoords[2], sideTexCoords[1],
    // Back face (-Z)
    0, 0, 0, 0, 0, -1, faceTexCoords[0], faceTexCoords[3],
    0, 2, 0, 0, 0, -1, faceTexCoords[0], faceTexCoords[1],
    1, 2, 0, 0, 0, -1, faceTexCoords[2], faceTexCoords[1],
    1, 0, 0, 0, 0, -1, faceTexCoords[2], faceTexCoords[3],
    // Top face (+Y)
    0, 2, 0, 0, 1, 0, topTexCoords[2], topTexCoords[1],
    0, 2, 1, 0, 1, 0, topTexCoords[2], topTexCoords[3],
    1, 2, 1, 0, 1, 0, topTexCoords[0], topTexCoords[3],
    1, 2, 0, 0, 1, 0, topTexCoords[0], topTexCoords[1],
    // Bottom face (-Y)
    0, 0, 0, 0, -1, 0, sideTexCoords[0], sideTexCoords[1],
    1, 0, 0, 0, -1, 0, sideTexCoords[2], sideTexCoords[1],
    1, 0, 1, 0, -1, 0, sideTexCoords[2], sideTexCoords[3],
    0, 0, 1, 0, -1, 0, sideTexCoords[0], sideTexCoords[3],
    // Right face (+X)
    1, 0, 0, 1, 0, 0, sideTexCoords[0], sideTexCoords[3],
    1, 2, 0, 1, 0, 0, sideTexCoords[0], sideTexCoords[1],
    1, 2, 1, 1, 0, 0, sideTexCoords[2], sideTexCoords[1],
    1, 0, 1, 1, 0, 0, sideTexCoords[2], sideTexCoords[3],
    // Left face (-X)
    0, 0, 0, -1, 0, 0, sideTexCoords[2], sideTexCoords[3],
    0, 0, 1, -1, 0, 0, sideTexCoords[0], sideTexCoords[3],
    0, 2, 1, -1, 0, 0, sideTexCoords[0], sideTexCoords[1],
    0, 2, 0, -1, 0, 0, sideTexCoords[2], sideTexCoords[1]
  ]);

  // Indices
  var elementData = new Uint16Array(36);
  for (var n = 0, i = 0, v = 0; n < 6; n++, i += 6, v += 4) {
    elementData[i + 0] = 0 + v;
    elementData[i + 1] = 1 + v;
    elementData[i + 2] = 2 + v;
    elementData[i + 3] = 0 + v;
    elementData[i + 4] = 2 + v;
    elementData[i + 5] = 3 + v;
  }

  return new gf.mdl.GeometryData([
    // XYZ
    new gf.mdl.GeometryData.Attribute(
        3, gf.mdl.ComponentType.FLOAT, false, 32, 0),
    // NXYZ
    new gf.mdl.GeometryData.Attribute(
        3, gf.mdl.ComponentType.FLOAT, false, 32, 12),
    // UV
    new gf.mdl.GeometryData.Attribute(
        2, gf.mdl.ComponentType.FLOAT, false, 32, 24)
  ], attributeData, elementData);
};
