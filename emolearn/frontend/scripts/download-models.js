const https = require('https');
const fs = require('fs');
const path = require('path');

const models = [
  'tiny_face_detector_model-shard1',
  'tiny_face_detector_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_recognition_model-weights_manifest.json',
  'face_expression_model-shard1',
  'face_expression_model-weights_manifest.json',
  'age_gender_model-shard1',
  'age_gender_model-weights_manifest.json',
];

const modelUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const targetDir = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

models.forEach(model => {
  const url = `${modelUrl}/${model.replace('-weights_manifest.json', '.json').replace('-shard1', '.bin').replace('-shard2', '.bin')}`;
  const manifestUrl = `${modelUrl}/${model}`;
  const finalUrl = model.endsWith('.json') ? manifestUrl : url.replace('.bin', `/${model}`);

  const finalUrlToFetch = model.includes('manifest')
    ? `${modelUrl}/${model}`
    : `${modelUrl}/${model.replace(/-(shard1|shard2)/, '.bin')}`;

  const newUrl = `https://raw.githubusercontent.com/vladmandic/face-api/master/public/models/${model.endsWith('.json') ? model : model.replace(/-(shard1|shard2)/, '.bin')}`;
  const anotherNewUrl = `https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/${model}`;

  const fileUrl = anotherNewUrl;
  const filePath = path.join(targetDir, model.endsWith('.json') ? model : model.replace(/-(shard1|shard2)/, '.bin'));
  const finalFilePath = path.join(targetDir, model);

  const file = fs.createWriteStream(finalFilePath);
  console.log(`Downloading ${model} to ${finalFilePath}`);

  https.get(fileUrl, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${model}`);
    });
  }).on('error', err => {
    fs.unlink(finalFilePath);
    console.error(`Error downloading ${model}: ${err.message}`);
  });
});
