import * as ts from 'typescript';
import { ParsedSourceFile, ParsedClass, ParsedPojo, ParsedReactComponent, ParsedReactProp } from './model';
import debugFactory from 'debug';

const debug = debugFactory('jest-test-gen/parse-source-file');
const isNodeJSX = (node: ts.Node) => [
  ts.SyntaxKind.JsxElement, 
  ts.SyntaxKind.JsxFragment, 
  ts.SyntaxKind.JsxExpression, 
  ts.SyntaxKind.JsxSelfClosingElement
].includes(node.kind);
export function parseSourceFile(file: ts.SourceFile): ParsedSourceFile {
  const result: ParsedSourceFile = {
    imports: [],
    exportFunctions: [],
    exportPojos: [],
    exportClass: undefined,
    exportComponents: [],
    components: [],
    classes: [],
    functions: [],
    pojos: [],
  };
  walker(file);
  return result;

  function walker(node: ts.Node) {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        debug('walker found import declaration');
        importsWalker(node as ts.ImportDeclaration);
        break;
      case ts.SyntaxKind.ClassDeclaration:
        debug('walker found class declaration');
        classWalker(node as ts.ClassDeclaration);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        debug('walker found function declaration');
        functionDeclarationWalker(node as ts.FunctionDeclaration);
        break;
      case ts.SyntaxKind.VariableStatement:
        debug('walker found variable statement');
        variableStatementWalker(node as ts.VariableStatement);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        debug('walker found export declaration');
        exportDeclarationWalker(node as ts.ExportDeclaration);
        break;
      case ts.SyntaxKind.ExportAssignment:
        debug('walker found export assignment');
        exportAssignementWalker(node as ts.ExportAssignment);
        break;
      case ts.SyntaxKind.ExpressionStatement:
        debug('walker found expression statement');
        expressionStatementWalker(node as ts.ExpressionStatement);
        break;
      default:
        ts.forEachChild(node, walker);
    }
  }
  function hasAsyncModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration |  ts.FunctionExpression | ts.MethodDeclaration) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword): false;
  }
  function hasStaticModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration |  ts.FunctionExpression | ts.MethodDeclaration) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword): false;
  }
  function hasExportModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.VariableStatement) {
    return node.modifiers ? node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword): false;
  }
  function hasDefaultModifier(node: ts.ClassDeclaration | ts.FunctionDeclaration | ts.FunctionExpression | ts.VariableStatement) {
    return node.modifiers ? node.modifiers.some(mode => mode.kind === ts.SyntaxKind.DefaultKeyword): false;
  }
  function hasReactInheritance(node: ts.ClassDeclaration) {
    let hasReactTypeExpression = (type: ts.ExpressionWithTypeArguments) => {
      const outerExpression = (type.expression as ts.PropertyAccessExpression)
      const innerExpression = outerExpression.expression;
      const expressionName = outerExpression.name.escapedText;
      return (innerExpression as ts.Identifier).escapedText  === 'React' &&
        ['PureComponent','Component'].includes(expressionName as string);
    }
    if (!node.heritageClauses) {
      return false;
    }
    return node.heritageClauses.some(clause => clause.types.some(hasReactTypeExpression));
  }
  
  function hasJSXChildElement(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.VariableStatement) {
    let hasJSX = false;
    ts.forEachChild(node, function visitor(child){
      if (isNodeJSX(child)) {
        hasJSX = true;
      }
      if(child.getChildren()){
        ts.forEachChild(child, visitor);
      }
    });
    return hasJSX;
  }
  function startsWithCapitalOrNoName(name: ts.__String | string) {
    if(!name) return true;
    return !!name.match(/^[A-Z]{1}/);
  }
  function classWalker(node: ts.ClassDeclaration) {
    const klass: ParsedClass = {
      name: node.name && node.name.escapedText as any,
      methods: [],
      isDefaultExport: hasDefaultModifier(node),
    };
    if(startsWithCapitalOrNoName(klass.name) && hasReactInheritance(node)){
      const currComp: ParsedReactComponent = {
        name: klass.name,
        isFunctional: false,
        isDefaultExport: hasDefaultModifier(node),
        props: [],
      }
      hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
      return;
    }
    ts.forEachChild(node, (child) => {
      if (child.kind === ts.SyntaxKind.MethodDeclaration){
        const methodChild = child as ts.MethodDeclaration;
        const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
        klass.methods.push({
          methodName,
          params: methodChild.parameters.map(param => (param.name as ts.Identifier).escapedText),
          isAsync: hasAsyncModifier(methodChild),
          isStatic: hasStaticModifier(methodChild),
        })
      }
    });
    result.classes.push(klass)
    if (hasExportModifier(node)) {
      result.exportClass = klass;
    }
  }

  function importsWalker(node: ts.ImportDeclaration) {
    const names: string[] = [];
    let importText: string = ''; 
    if (node.importClause) {
      importText = node.getText();
      ts.forEachChild(node.importClause, (child) => {
        ts.forEachChild(child, (element) => {
          names.push(element.getText());
        });
      });
    }
    result.imports.push({
      path: node.moduleSpecifier.getText(),
      names,
      importText,
    });
  }

  function functionDeclarationWalker(node: ts.FunctionDeclaration){
    const parsedFunction = {
      name: node.name ? node.name.escapedText: '',
      params: node.parameters.map(param => (param.name as ts.Identifier).escapedText),
      isAsync: hasAsyncModifier(node),
      isDefaultExport: hasDefaultModifier(node)
    };
    debug('function: ', parsedFunction.name, 'isJsx', hasJSXChildElement(node))
    if(startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)){
      const currComp: ParsedReactComponent = {
        name: parsedFunction.name,
        isFunctional: true,
        isDefaultExport: parsedFunction.isDefaultExport,
        props: [],
      }
      hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
      return;
    }
    if(hasExportModifier(node)){
      result.exportFunctions.push(parsedFunction);
    } else {
      result.functions.push(parsedFunction);
    }
  }

  function variableStatementWalker(node: ts.VariableStatement){
    // check only exported variable statements.
    if(node.declarationList){
      node.declarationList.forEachChild((child) => {
        //handle arrow function declaration
        const varChild = child as ts.VariableDeclaration;
        if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ArrowFunction){
          const parsedFunction = {
            name: (varChild.name as ts.Identifier).escapedText,
            params: (varChild.initializer as ts.FunctionExpression).parameters.map(param => (param.name as ts.Identifier).escapedText),
            isAsync: hasAsyncModifier(varChild.initializer as ts.FunctionExpression),
            isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
          };
          if(startsWithCapitalOrNoName(parsedFunction.name) && hasJSXChildElement(node)){
            const currComp: ParsedReactComponent = {
              name: parsedFunction.name,
              isFunctional: true,
              isDefaultExport: parsedFunction.isDefaultExport,
              props: [],
            }
            hasExportModifier(node) ? result.exportComponents.push(currComp): result.components.push(currComp);
            return;
          }
          if (hasExportModifier(node)) {
            result.exportFunctions.push(parsedFunction);
          } else {
            result.functions.push(parsedFunction);
          }
        }
        //handle exported pojo with callable methods
        if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ObjectLiteralExpression){
          const parsedPojo: ParsedPojo = {
            name: varChild.name && (varChild.name as ts.Identifier).escapedText,
            isDefaultExport: hasDefaultModifier(varChild.initializer as ts.FunctionExpression),
            methods: [],
          };
          (varChild.initializer as ts.ObjectLiteralExpression).properties.forEach((propNode: ts.Node) => {
            if (propNode.kind === ts.SyntaxKind.MethodDeclaration){
              const methodNode = propNode as ts.MethodDeclaration;
              const methodName = methodNode.name ? (methodNode.name as ts.Identifier).escapedText : '';
              parsedPojo.methods.push({
                methodName,
                params: methodNode.parameters.map(param => (param.name as ts.Identifier).escapedText),
                isAsync: hasAsyncModifier(methodNode),
                isStatic: false,
              })
            }
          });
          if(hasExportModifier(node)) {
            result.exportPojos.push(parsedPojo);
          } else {
            result.pojos.push(parsedPojo);
          }
        }
        if(varChild.initializer && varChild.initializer.kind === ts.SyntaxKind.ClassExpression){
          const klassExp: ParsedClass = {
            name: varChild.name && (varChild.name as ts.Identifier).escapedText,
            methods: [],
            isDefaultExport: false,
          };
          ts.forEachChild(varChild.initializer, (child) => {
            const methodChild = child as ts.MethodDeclaration;
            if (child.kind === ts.SyntaxKind.MethodDeclaration){
              const methodName = methodChild.name ? (methodChild.name as ts.Identifier).escapedText : '';
              klassExp.methods.push({
                methodName,
                params: (child as ts.MethodDeclaration).parameters.map(param => (param.name as ts.Identifier).escapedText),
                isAsync: hasAsyncModifier(child as ts.MethodDeclaration),
                isStatic: hasStaticModifier(child as ts.MethodDeclaration),
              })
            }
          });
          result.classes.push(klassExp);
          result.exportClass = klassExp;
        }
      })
    }
  }

  function exportDeclarationWalker(node: ts.ExportDeclaration){
    node.exportClause && (node.exportClause as ts.NamedExports).elements.forEach(identifier => {
      const idName = identifier.name.escapedText;
      const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
      if(foundClassByIdentifier) {
        result.exportClass = foundClassByIdentifier;
      }
      const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
      if(foundFunctionByIdentifier){
        result.exportFunctions.push(foundFunctionByIdentifier);
      }
      const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
      if(foundPojoByIdentifier){
        result.exportPojos.push(foundPojoByIdentifier);
      }
      const foundComponentByIdentifier = result.components.find(component => component.name === idName);
      if(foundComponentByIdentifier){
        result.exportComponents.push(foundComponentByIdentifier);
      }
    });
  }

  function exportAssignementWalker(node: ts.ExportAssignment){
    const idName = (node.expression as ts.Identifier).escapedText;
    const foundClassByIdentifier = result.classes.find(klass => klass.name === idName);
    if(foundClassByIdentifier) {
      result.exportClass = {
       ...foundClassByIdentifier,
       isDefaultExport: true,
      };
    }
    const foundFunctionByIdentifier = result.functions.find(func => func.name === idName);
    if(foundFunctionByIdentifier){
      result.exportFunctions.push({
        ...foundFunctionByIdentifier,
        isDefaultExport: true,
      });
    }
    const foundPojoByIdentifier = result.pojos.find(pojo => pojo.name === idName);
      if(foundPojoByIdentifier){
        result.exportPojos.push({
          ...foundPojoByIdentifier,
          isDefaultExport: true,
        })
      }
    const foundComponentByIdentifier = result.components.find(component => component.name === idName);
    if(foundComponentByIdentifier){
      result.exportComponents.push({
        ...foundComponentByIdentifier,
        isDefaultExport: true
      });
    }
  }
  function expressionStatementWalker(node: ts.ExpressionStatement) {
    //look for binary expressions 
    if(node.expression?.kind  === ts.SyntaxKind.BinaryExpression){
      const binaryExpression = node.expression as ts.BinaryExpression;
      const leftExp = binaryExpression.left as ts.PropertyAccessExpression;
      const rightExp = binaryExpression.right as ts.ObjectLiteralExpression;
      const findMatchingComponent = (idName: ts.__String) => { 
        return result.exportComponents.find(component => component.name === idName) ||
          result.components.find(component => component.name === idName);
      }
      if (leftExp.name.escapedText === 'propTypes'){
        const expText = (leftExp.expression as ts.Identifier)?.escapedText;
        const currComponent = findMatchingComponent(expText);
        if(currComponent){
          currComponent.props = parseReactPropTypesFromLiteral(rightExp);
        }
      }
    }
  }
  function parseReactPropTypesFromLiteral(literalObj: ts.ObjectLiteralExpression) : ParsedReactProp[] {
    return (literalObj.properties as ts.NodeArray<ts.PropertyAssignment>).filter(prop => prop.name).map((prop: ts.PropertyAssignment) => {
      const fullPropText = prop.initializer.getFullText().replace(/\n/ ,'');
      return { 
        name: (prop.name as ts.Identifier)?.escapedText,
        type: fullPropText,
        isOptional: fullPropText.indexOf('isRequired') === -1
      }
    });
  }
}
