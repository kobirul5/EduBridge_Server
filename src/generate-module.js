const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, 'app/modules');

const generateModule = (moduleName) => {
  if (!moduleName) {
    console.error('Please provide a module name!');
    process.exit(1);
  }

  const modulePath = path.join(MODULES_DIR, moduleName);

  if (fs.existsSync(modulePath)) {
    console.error(`Module '${moduleName}' already exists!`);
    process.exit(1);
  }

  // Create module folder
  fs.mkdirSync(modulePath, { recursive: true });

  // Capitalize module name
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const capitalizedModule = capitalize(moduleName);

  // Generate files
  const files = {
    controller: `
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ${moduleName}Service } from './${moduleName}.service';
import httpStatus from 'http-status';

const create${capitalizedModule} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.create(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: '${capitalizedModule} created successfully!',
    data: result,
  });
});

const getAll${capitalizedModule}s = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.getAll();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: '${capitalizedModule}s fetched successfully!',
    data: result,
  });
});

const get${capitalizedModule}ById = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.getById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: '${capitalizedModule} fetched successfully!',
    data: result,
  });
});

const update${capitalizedModule} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.update(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: '${capitalizedModule} updated successfully!',
    data: result,
  });
});

const delete${capitalizedModule} = catchAsync(async (req, res) => {
  const result = await ${moduleName}Service.remove(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: '${capitalizedModule} deleted successfully!',
    data: result,
  });
});

export const ${moduleName}Controller = {
  create${capitalizedModule},
  getAll${capitalizedModule}s,
  get${capitalizedModule}ById,
  update${capitalizedModule},
  delete${capitalizedModule},
};
    `,
    service: `
import prisma from '../../shared/prisma';

const create = async (data) => {
  return await prisma.${moduleName}.create({ data });
};

const getAll = async () => {
  return await prisma.${moduleName}.findMany();
};

const getById = async (id) => {
  const item = await prisma.${moduleName}.findUnique({ where: { id } });
  if (!item) throw new Error('${capitalizedModule} not found!');
  return item;
};

const update = async (id, data) => {
  return await prisma.${moduleName}.update({
    where: { id },
    data,
  });
};

const remove = async (id) => {
  return await prisma.${moduleName}.delete({ where: { id } });
};

export const ${moduleName}Service = {
  create,
  getAll,
  getById,
  update,
  remove,
};
    `,
    routes: `
import { Router } from 'express';
import { ${moduleName}Controller } from './${moduleName}.controller';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post('/', validateRequest, ${moduleName}Controller.create${capitalizedModule});
router.get('/', ${moduleName}Controller.getAll${capitalizedModule}s);
router.get('/:id', ${moduleName}Controller.get${capitalizedModule}ById);
router.put('/:id', validateRequest, ${moduleName}Controller.update${capitalizedModule});
router.delete('/:id', ${moduleName}Controller.delete${capitalizedModule});

export const ${moduleName}Routes = router;
    `,
    validation: `
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required!'),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const ${moduleName}Validation = {
  createSchema,
  updateSchema,
};
    `,
  };

  for (const [key, content] of Object.entries(files)) {
    const filePath = path.join(modulePath, `${moduleName}.${key}.ts`);
    fs.writeFileSync(filePath, content.trim());
    console.log(`Created: ${filePath}`);
  }

  console.log(`Module '${moduleName}' created successfully!`);
};

// Run script
const [, , moduleName] = process.argv;
generateModule(moduleName);
