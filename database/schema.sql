-- CodeSentry · MySQL 8.0.16+ / MariaDB 10.2+ (XAMPP)
CREATE DATABASE IF NOT EXISTS codesentry CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE codesentry;

CREATE TABLE Estado (
  id_estado       INT AUTO_INCREMENT PRIMARY KEY,
  nombre_estado   VARCHAR(30) NOT NULL,
  contexto_modulo VARCHAR(30) NOT NULL
);

CREATE TABLE Lenguaje (
  id_lenguaje INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE Proyecto (
  id_proyecto         INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100) NOT NULL,
  ruta_carpeta        VARCHAR(255) NOT NULL UNIQUE,
  fecha_registro      DATE NOT NULL DEFAULT (CURRENT_DATE),
  fecha_actualizacion DATE NULL,
  id_estado           INT NOT NULL,
  FOREIGN KEY (id_estado) REFERENCES Estado(id_estado)
);

CREATE TABLE Proyecto_Lenguaje (
  id_proyecto INT NOT NULL,
  id_lenguaje INT NOT NULL,
  PRIMARY KEY (id_proyecto, id_lenguaje),
  FOREIGN KEY (id_proyecto) REFERENCES Proyecto(id_proyecto) ON DELETE CASCADE,
  FOREIGN KEY (id_lenguaje) REFERENCES Lenguaje(id_lenguaje)
);

CREATE TABLE Archivo (
  id_archivo     INT AUTO_INCREMENT PRIMARY KEY,
  id_proyecto    INT NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_relativa  VARCHAR(255) NOT NULL,
  lenguaje       VARCHAR(20) NOT NULL,
  CONSTRAINT chk_archivo_lenguaje CHECK (lenguaje IN ('js','ts','py')),
  FOREIGN KEY (id_proyecto) REFERENCES Proyecto(id_proyecto) ON DELETE CASCADE
);

CREATE TABLE SolicitudRevision (
  id_solicitud    INT AUTO_INCREMENT PRIMARY KEY,
  id_proyecto     INT NOT NULL,
  tipo_objetivo   VARCHAR(10) NOT NULL,
  id_archivo      INT NULL,
  fecha_solicitud DATE NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT chk_solicitud_tipo CHECK (tipo_objetivo IN ('carpeta','archivo')),
  FOREIGN KEY (id_proyecto) REFERENCES Proyecto(id_proyecto) ON DELETE CASCADE,
  FOREIGN KEY (id_archivo)  REFERENCES Archivo(id_archivo)
);

CREATE TABLE Analisis (
  id_analisis     INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud    INT NOT NULL,
  fecha_analisis  DATE NOT NULL DEFAULT (CURRENT_DATE),
  modelo_ia_usado VARCHAR(50) NOT NULL DEFAULT 'qwen2.5-coder',
  id_estado       INT NOT NULL,
  FOREIGN KEY (id_solicitud) REFERENCES SolicitudRevision(id_solicitud) ON DELETE CASCADE,
  FOREIGN KEY (id_estado)    REFERENCES Estado(id_estado)
);

CREATE TABLE Resultado (
  id_resultado INT AUTO_INCREMENT PRIMARY KEY,
  id_analisis  INT NOT NULL,
  tipo         VARCHAR(20) NOT NULL,
  descripcion  TEXT NOT NULL,
  severidad    VARCHAR(15) NOT NULL,
  linea_codigo INT NOT NULL,
  CONSTRAINT chk_resultado_sev CHECK (severidad IN ('baja','media','alta','critica')),
  CONSTRAINT chk_resultado_linea CHECK (linea_codigo >= 1),
  FOREIGN KEY (id_analisis) REFERENCES Analisis(id_analisis) ON DELETE CASCADE
);

CREATE TABLE ChecklistItem (
  id_checklist  INT AUTO_INCREMENT PRIMARY KEY,
  id_resultado  INT NOT NULL,
  id_estado     INT NOT NULL,
  fecha_marcado DATE NULL,
  FOREIGN KEY (id_resultado) REFERENCES Resultado(id_resultado) ON DELETE CASCADE,
  FOREIGN KEY (id_estado)    REFERENCES Estado(id_estado)
);

CREATE TABLE Reporte (
  id_reporte       INT AUTO_INCREMENT PRIMARY KEY,
  id_analisis      INT NOT NULL,
  fecha_generacion DATE NOT NULL DEFAULT (CURRENT_DATE),
  formato          VARCHAR(10) NOT NULL,
  ruta_archivo     VARCHAR(255) NOT NULL,
  CONSTRAINT chk_reporte_formato CHECK (formato IN ('pdf','html','json')),
  FOREIGN KEY (id_analisis) REFERENCES Analisis(id_analisis) ON DELETE CASCADE
);
