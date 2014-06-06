// 'use strict';

define(['text!README.md'], function(_readme) {

  var MD_HEADER_RGX = /(?:[\r\n]|^)\s+(#+)([^\r\n]*)/,
      MD_COMMENT_RGX = /<!--\s*(?:(describe|context|section|let|before|it|load|inject|provide):((?:.|[\r\n])*?)|(end|ignore|describe))\s*-->/,
      MD_JSBLOCK_RGX = /\u0060\u0060\u0060javascript((?:.|[\r\n])*?)\u0060\u0060\u0060/,
      PARSER_RGX = new RegExp('(?:' + MD_HEADER_RGX.source + '|' + MD_COMMENT_RGX.source + '|' + MD_JSBLOCK_RGX.source + ')', 'g');

  var blocks = _readme.match(PARSER_RGX), index = 0;

  function wrapBeforeEachCode(_code) {
    return function(_scope) {
      beforeEach(function() {
        with(_scope) { eval(_code); }
      });
    };
  }

  function wrapItCode(_code) {
    return function(_scope) {
      it('', function() {
        with(_scope) { eval(_code); }
      });
    };
  }

  function wrapLoadModule(_module) {
    return function() {
      beforeEach(module(_module));
    };
  }

  function wrapProvide(_module) {
    return function(_scope) {
      beforeEach(module([_module, function(_mod) {
        _scope[_module] = _mod;
      }]));
    };
  }

  function wrapInject(_module) {
    return function(_scope) {
      beforeEach(inject([_module, function(_mod) {
        _scope[_module] = _mod;
      }]));
    };
  }

  function buildTokenTree(_header, _level) {

    var node = {
      header: _header,
      statements: [],
      childs: []
    }, m, block;

    for(; (block = blocks[index]); index++) {
      if(block[0] === '`') {
        // code block, create a before each.
        node.statements.push(wrapBeforeEachCode(block.match(MD_JSBLOCK_RGX)[1]));
      } else if(block[0] === '<') {
        m = block.match(MD_COMMENT_RGX);
        if(m[1] === 'describe' || m[1] === 'context' || m[1] === 'section') {
          index++;
          node.childs.push(buildTokenTree(m[2], -1));
        } else if(m[3] === 'ignore') {
          // ignore everything until 'end' is found
          do {
            index++;
          } while((block = blocks[index]) && !(block[0] === '<' && block.match(MD_COMMENT_RGX)[3] === 'end'));
        } else if(m[1] === 'before') {
          node.statements.push(wrapBeforeEachCode(m[2].trim()));
        } else if(m[1] === 'it') {
          node.statements.push(wrapItCode(m[2].trim()));
        } else if(m[3] === 'end') {
          if(_level !== -1) { index--; }
          break;

        // angular related extensions.
        } else if(m[1] === 'load') {
          node.statements.push(wrapLoadModule(m[2].trim()));
        } else if(m[1] === 'provide') {
          node.statements.push(wrapProvide(m[2].trim()));
        } else if(m[1] === 'inject') {
          node.statements.push(wrapInject(m[2].trim()));
        }
      } else {
        // header, if level is higher, nest context, if not, exit context
        m = block.match(MD_HEADER_RGX);
        if(_level === -1 || m[1].length > _level) {
          index++;
          node.childs.push(buildTokenTree(m[2], m[1].length));
        } else {
          index--;
          break;
        }
      }
    }

    return node;
  }

  // create the test tree.
  var tree = buildTokenTree('README.md: ', -1);

  function createScope(_parent) {
    function ScopeType() {}
    ScopeType.prototype = _parent || window;
    return new ScopeType();
  }

  function evalTree(_node, _parentScope) {
    describe(_node.header, function() {

      var i, l, scope = createScope(_parentScope);

      for(i = 0, l = _node.statements.length; i < l; i++) {
        _node.statements[i](scope);
      }

      for(i = 0, l = _node.childs.length; i < l; i++) {
        evalTree(_node.childs[i], scope);
      }
    });
  }

  describe(null, function() {

    it('should exists and not be empty', function() {
      expect(_readme.length).toBeGreaterThan(0);
    });

    evalTree(tree);

  });

});

