const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require("./model");
const Sequelize = require('sequelize');


/* -------------- Funciones auxiliares con promesas --------------*/
/* Funcion auxiliar que valida el id y lo convierte a entero*/
const validateId = id => {
  return new Sequelize.Promise((resolve, reject) =>{
    if (typeof id === "undefined") {
      reject(new Error('Falta el parámetro <id>'));
    } else {
      id = parseInt(id);
      if (Number.isNaN(id)) {
        reject(new Error('El valor del parámetro <id> no es un número'));
      } else {
        resolve(id);
      }
    }
  });
};

/* Funcion que devuelve pregunta*/
const makeQuestion = (rl, text) => {
  return new Sequelize.Promise((resolve, reject) => {
    rl. question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};

/* ------------------------- Funciones auxiliares de los comandos ------------------------------*/

/* Abre la ayuda */
exports.helpCmd = (socket, rl) => {
  log(socket, 'Comandos:');
  log(socket, ' h|help - Muestra esta ayuda');
  log(socket, ' list - Listar los quizzes exixtentes');
  log(socket, ' show <id> - Muestra la pregunta y la respuesta del quiz indicado');
  log(socket, ' add - Añade un nuevo quiz interactivamente');
  log(socket, ' delete <id> - Borra el quiz indicado');
  log(socket, ' edit <id> - Edita el quiz indicado');
  log(socket, ' test <id> - Prueba el quiz indicado');
  log(socket, ' p|play  Juega a preguntar aleatoriamente todos los quizzes');
  log(socket, ' credits - Créditos');
  log(socket, ' q|quit - Sale del programa');
  rl.prompt();
};

/* Sale del programa*/
exports.quitCmd = (socket, rl) => {
  rl.close();
  socket.end();
};

/* Añade una pregunta*/
exports.addCmd = (socket, rl) => {
  makeQuestion(rl, 'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, 'Introduzca la respuesta: ')
    .then(a => {
      return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
  .then(quiz => {
    log(socket, `${colorize('Se ha añadido ', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo: ');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/* Lista las preguntas y respuestas*/
exports.listCmd = (socket, rl) => {
  models.quiz.findAll()
  .each(quiz =>{
      log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/* Muestra el quiz*/
exports.showCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id = ${id}`);
    }
    log(socket, `[${colorize(id, 'magenta')}] : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  })
};

/* Prueba el quiz */
exports.testCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id = ${id}`);
      rl.prompt();
    }
    makeQuestion(rl, `${colorize(quiz.question, 'red')}: `)
    .then(a => {
      if (quiz.answer.toLowerCase() === a.trim().toLowerCase()){
        log(socket, `Su respuesta es correcta`);
        //biglog('Correcta', 'green');
        rl.prompt();
      } else {
        log(socket, `Su respuesta es incorrecta`);
        //biglog('Incorrecta', 'red');
        rl.prompt();
      }
    });
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo: ');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/* Juega*/
exports.playCmd = (socket, rl) => {
  log('Jugar', 'red');
  let score = 0;
  let toBeAns = [];
  let quizLeft = [];
  let i = 0;
  let max = 0;
 
  models.quiz.findAll()
  .each(quiz => {
    quizLeft.push(quiz);
  })
  .then(() => {
    
    for (i; i < quizLeft.length; i++) {
      toBeAns.push(i);
    }
    
    const playOne = () => {
      let id = Math.floor(Math.random()*(toBeAns.length));
      //Pregunta de id
      if (toBeAns.length === 0){
        log(socket, ` No quedan preguntas por responder `);
        log(socket, ` Fin del juego. Tu resultado es: `);
        //biglog(score, 'yellow');
        rl.prompt();
      } else {
        const quiz = quizLeft[toBeAns[id]];
        makeQuestion(rl, `${colorize(quiz.question, 'red')}: `)
        .then(a => {
          if (quiz.answer.toLowerCase() === a.trim().toLowerCase()){
            score++;
            log(socket, `${colorize(' CORRECTO ', 'green')} - Lleva ${colorize(score, 'yellow')} aciertos`);
            toBeAns.splice(id, 1);  //Quitar id de toBeAns
            playOne();
            rl.prompt();
          } else {
            log(socket, `${colorize(' INCORRECTO ', 'red')}`);
            log(socket, `Fin del juego. Aciertos: ${score}`);
           // biglog(score, 'yellow');
            rl.prompt();
          }
        })
        .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erróneo: ');
        error.errors.forEach(({message}) => errorlog(socket, message));
        })
        .catch(error => {
          errorlog(socket, error.message);
        })
        .then(() => {
          rl.prompt();
        });
      }
    }
    playOne();
    rl.prompt();
    });
};

/* Edita quiz*/
exports.editCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id = ${id}`);
    }
    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    })
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize(' => ', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo: ');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/* Borra quiz*/
exports.deleteCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  })
};

/* Saca los créditos*/
exports.creditsCmd = (socket, rl) => {
  log("Autor de práctica");
  log("Melisa Anahí Maccio Parigino", 'green');
  rl.prompt();
};