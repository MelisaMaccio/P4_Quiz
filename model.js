const fs = require("fs");
const DB_FILENAME = "quizzes.json"; // Nombre del fichero donde se guardan las preguntas

//Modelo de datos, se mantienen los quizzes existentes y guarda las añadidas

let quizzes = [
  {
    question: "Capital de Italia",
    answer: "Roma"
  },
  {
    question: "Capital de Francia",
    answer: "París"
  },
  {
    question: "Capital de España",
    answer: "Madrid"
  },
  {
    question: "Capital de Portugal",
    answer: "Lisboa"
  }
];

//Carga los nuevos quizzes
const load = () => {
  fs.readFile(DB_FILENAME, (err, data) => {
    if (err) {
      //La primera vez no existe el fichero
      if(err.code === "ENOENT") {
        save(); //valores iniciales
        return;
      }
      throw err;
    }
    let json = JSON.parse(data);
    if (json) {
      quizzes = json;
    }
  });
};

//Guarda los quizzes en un fichero
const save = () => {
  fs.writeFile(DB_FILENAME, JSON.stringify(quizzes), err => {
    if (err) throw err;
    });
};

//Devuelve el número de quizzes
exports.count = () => quizzes.length;

//Añade quiz
exports.add = (question, answer) => {
  quizzes.push({
    question: (question||"").trim(),
    answer: (answer||"").trim()
  });
  save();
};

//Actuliza quiz
exports.update = (id, question, answer) =>{
  const quiz = quizzes[id];
  if (typeof quiz === "undefined") {
    throw new Error(`El valor del parámetro id no es válido`);
  }
  quizzes.splice(id, 1, {
    question: (question||"").trim(),
    answer: (answer||"").trim()
  });
  save();
};

//Devuelve todos los quizzes
exports.getAll = () => JSON.parse(JSON.stringify(quizzes));

//Devuelve un quiz concreto
exports.getByIndex = id => {
  const quiz = quizzes[id];
  if (typeof quiz === "undefined") {
    throw new Error(`El valor del parámetro id no es válido`);
  }
  return JSON.parse(JSON.stringify(quiz));
};

//Elimina el quiz
exports.deleteByIndex = id =>{
  const quiz = quizzes[id];
  if (typeof quiz === "undefined") {
    throw new Error(`El valor del parámetro id no es válido`);
  }
  quizzes.splice(id, 1);
  save();
};

//Carga quizzes
load();