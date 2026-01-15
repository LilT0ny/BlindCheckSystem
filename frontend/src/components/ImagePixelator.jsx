import React, { useState, useRef, useEffect } from 'react';
import './ImagePixelator.css';

const ImagePixelator = ({ imageUrl, onAreaSelected }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);

  // Log cuando el componente se monta
  useEffect(() => {
    console.log('🎨 ImagePixelator montado');
    console.log('🎨 onAreaSelected recibido:', typeof onAreaSelected);
    console.log('🎨 imageUrl recibido:', imageUrl);
  }, []);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        imageRef.current = img;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        setImageLoaded(true);
      };
      
      img.src = imageUrl;
    }
  }, [imageUrl]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;
    const pos = getMousePos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !imageLoaded) return;
    const pos = getMousePos(e);
    setCurrentPos(pos);
    drawSelection(startPos, pos);
  };

  const handleMouseUp = (e) => {
    console.log('🖱️ Mouse UP detectado - isDrawing:', isDrawing, 'imageLoaded:', imageLoaded);
    
    if (!imageLoaded) {
      console.log('⚠️ Imagen no cargada aún');
      return;
    }
    
    if (!isDrawing) {
      console.log('⚠️ No estaba dibujando (isDrawing = false)');
      return;
    }
    
    // Obtener posición final directamente del evento (no del estado)
    const endPos = getMousePos(e);
    
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);
    
    console.log('🖱️ Mouse UP - Dimensiones:', { width, height });
    console.log('🖱️ Posiciones:', { start: startPos, end: endPos });
    
    // Ahora sí, marcar como no dibujando
    setIsDrawing(false);
    
    // Aceptar cualquier tamaño de área (sin validación mínima)
    const selectionArea = {
      x: Math.min(startPos.x, endPos.x),
      y: Math.min(startPos.y, endPos.y),
      width: width,
      height: height
    };
    
    console.log('✅ Área capturada, enviando:', selectionArea);
    console.log('✅ onAreaSelected disponible?', typeof onAreaSelected);
    setSelection(selectionArea);
    
    // Llamar inmediatamente a onAreaSelected
    if (onAreaSelected && typeof onAreaSelected === 'function') {
      console.log('📤 Llamando a onAreaSelected con:', selectionArea);
      try {
        onAreaSelected(selectionArea);
        console.log('✅ onAreaSelected ejecutado exitosamente');
      } catch (error) {
        console.error('❌ Error al llamar onAreaSelected:', error);
      }
    } else {
      console.warn('⚠️ onAreaSelected no está definido o no es función!', onAreaSelected);
    }
  };

  const drawSelection = (start, end) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Redibujar imagen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }
    
    // Dibujar rectángulo de selección
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      start.x,
      start.y,
      end.x - start.x,
      end.y - start.y
    );
    
    // Dibujar overlay semi-transparente
    ctx.fillStyle = 'rgba(220, 38, 38, 0.2)';
    ctx.fillRect(
      start.x,
      start.y,
      end.x - start.x,
      end.y - start.y
    );
  };

  const handleMouseLeave = (e) => {
    console.log('🚪 Mouse salió del canvas - isDrawing:', isDrawing);
    if (isDrawing) {
      // Si estaba dibujando, finalizar el área
      console.log('🚪 Finalizando área al salir del canvas');
      handleMouseUp(e);
    }
  };

  const clearSelection = () => {
    console.log('🔄 Limpiando selección');
    setSelection(null);
    
    // Llamar a onAreaSelected con null
    if (onAreaSelected) {
      onAreaSelected(null);
    }
    
    // Redibujar imagen sin selección
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0);
    }
  };

  return (
    <div className="image-pixelator">
      <div className="pixelator-instructions">
        <p>
          ✂️ <strong>Recorta la imagen:</strong> Dibuja un rectángulo sobre el área que QUIERES ELIMINAR.
        </p>
        <p>
          ✂️ <strong>Cómo funciona:</strong> Se eliminará todo lo que esté ARRIBA del rectángulo (incluyendo el rectángulo).
        </p>
        <p style={{ color: '#0369a1', fontWeight: 'bold' }}>
          💡 Tip: Dibuja el rectángulo sobre el nombre del estudiante. Se guardará lo que esté debajo.
        </p>
        {selection && (
          <div className="selection-info">
            <span className="badge badge-success">
              ✓ Área marcada ({Math.round(selection.width)} x {Math.round(selection.height)} px) - Esto y lo de arriba se eliminará
            </span>
            <button 
              type="button"
              onClick={clearSelection} 
              className="btn btn-sm btn-outline"
              style={{ marginLeft: '10px' }}
            >
              🔄 Limpiar
            </button>
          </div>
        )}
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
        />
      </div>
      
      {!imageLoaded && (
        <div className="loading-overlay">
          <span className="loading"></span>
          <p>Cargando imagen...</p>
        </div>
      )}
    </div>
  );
};

export default ImagePixelator;
