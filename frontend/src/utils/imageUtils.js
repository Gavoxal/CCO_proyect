import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen para reducir su peso manteniendo buena calidad.
 * @param {File} file - El archivo de imagen original.
 * @param {Object} customOptions - Opciones personalizadas para la compresión.
 * @returns {Promise<File>} - El archivo comprimido.
 */
export const compressImage = async (file, customOptions = {}) => {
  if (!file) return null;

  // Si el archivo es pequeño (ej. < 500KB), no es estrictamente necesario comprimir,
  // pero lo pasamos por la librería para normalizar orientación si es necesario.
  
  const options = {
    maxSizeMB: 1.5,           // Tamaño máximo deseado en MB
    maxWidthOrHeight: 1920,   // Resolución máxima (Full HD)
    useWebWorker: true,       // Mejor rendimiento en hilos separados
    initialQuality: 0.8,      // Calidad inicial
    ...customOptions
  };

  try {
    console.log(`Comprimiendo imagen: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Imagen comprimida: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Asegurarse de que el nombre del archivo se mantenga si la librería lo cambia
    return new File([compressedFile], file.name, {
      type: compressedFile.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error comprimiendo la imagen:', error);
    // En caso de error, devolvemos el original para no bloquear el flujo
    return file;
  }
};
