const { Sequelize, DataTypes, Op } = require("sequelize");
const { File, FeedbackAnswer, Task } = require("./models");

// ============================================
// 1. Configuration de la connexion
// ============================================
const sequelize = new Sequelize({
  database: process.env.DB_NAME || "academix_dev",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "admin123",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: false, // true pour voir les requêtes SQL
});
// ============================================
// FONCTION DE CORRECTION D'ENCODAGE
// ============================================
function fixEncoding(corruptedName) {
  try {
    // La chaîne corrompue contient des '×' (U+00D7) qui apparaissent
    // quand de l'UTF-8 est mal interprété comme Latin-1/Windows-1252

    // Étape 1 : Convertir la chaîne en bytes (chaque caractère = 1 byte)
    const bytes = Buffer.from(corruptedName, "latin1");

    // Étape 2 : Reconvertir les bytes en UTF-8 valide (hébreu)
    return bytes.toString("utf8");
  } catch (error) {
    console.error(`Erreur lors de la correction: ${error.message}`);
    return corruptedName;
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function fixCorruptedFileNames() {
  try {
    // Connexion à la base
    await sequelize.authenticate();
    console.log("✅ Connexion à PostgreSQL établie\n");

    // Récupérer tous les fichiers
    const files = await File.findAll();
    console.log(`📁 ${files.length} fichiers trouvés dans la table\n`);

    let correctedCount = 0;
    let alreadyOkCount = 0;
    let errorCount = 0;

    for (const file of files) {
      const originalName = file.name;

      // Vérifier si le nom est corrompu (contient le caractère '×')
      const isCorrupted = originalName.includes("×");

      if (isCorrupted) {
        const correctedName = fixEncoding(originalName);

        // Ne mettre à jour que si le nom a réellement changé
        if (correctedName !== originalName) {
          try {
            await file.update({ name: correctedName });
            correctedCount++;
            console.log(`  ✅ Corrigé:`);
            console.log(
              `     Avant: ${originalName.substring(0, 60)}${
                originalName.length > 60 ? "..." : ""
              }`
            );
            console.log(
              `     Après: ${correctedName.substring(0, 60)}${
                correctedName.length > 60 ? "..." : ""
              }\n`
            );
          } catch (updateError) {
            errorCount++;
            console.error(
              `  ❌ Erreur mise à jour ID ${file.id}: ${updateError.message}\n`
            );
          }
        }
      } else {
        alreadyOkCount++;
      }
    }


  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  } finally {
    await sequelize.close();
    console.log("\n🔒 Connexion fermée");
  }
}

// ============================================
// EXÉCUTION
// ============================================
fixCorruptedFileNames();
