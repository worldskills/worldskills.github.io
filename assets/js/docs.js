$(function () {

  var base = WORLDSKILLS_API_DOCS;
  
  function buildDefinitions(type, all, definitions) {

    var typeName = type;

    if (typeof definitions != 'undefined') {

      $.each(all, function (name, definition) {

        if ('#/definitions/' + name == type) {

          typeName = name;

          // Check if the definition has already been processed
          if (!definitions[name]) {

            definitions[name] = definition;

            if (typeof definition.properties != 'undefined' && definition.properties) {

              definition.propertiesSorted = [];

              $.each(definition.properties, function (name, property) {
                if ($.inArray(name, definition.required) !== -1) {
                  property.required = true;
                } else {
                  property.required = false;
                }
                if (typeof property.$ref != 'undefined' && property.$ref != type) {
                  property.definition = buildDefinitions(property.$ref, all, definitions);
                }
                if (typeof property.items != 'undefined' && property.items.$ref != type) {
                  property.items.definition = buildDefinitions(property.items.$ref, all, definitions);
                }

                property.key = name;
                definition.propertiesSorted.push(property);
              });

              // sort properties by position attribute
              definition.propertiesSorted.sort(function (a, b) {
                if (a.position === b.position) {
                    return 0;
                }
                if (a.position === null) {
                    return 1;
                }
                if (b.position === null) {
                    return -1;
                }
                if (a.position < b.position) {
                  return -1;
                }
                if (a.position > b.position) {
                  return 1;
                }
                return 0;
              });
            }
          }
        }
      });
    }

    return typeName;
  }

  function buildExample(type, definitions, optional, typeStack = []) {

    if (type == 'string') {
      return '';
    }

    if (type == 'boolean') {
      return false;
    }

    if (type == 'integer' || type == 'double' || type == 'number') {
      return 0;
    }

    if (type == 'array') {
      return [];
    }

    var example = {};

    if (typeof definitions != 'undefined') {

      $.each(definitions, function (name, definition) {

        if ('#/definitions/' + name == type) {

          if (typeStack.includes(type)) {
            return ''; // Prevent endless loop by returning an empty object
          }
          typeStack.push(type);

          if (typeof definition.propertiesSorted != 'undefined' && definition.propertiesSorted) {

            $.each(definition.propertiesSorted, function (index, property) {

              var name = property.key;

              if (optional || $.inArray(name, definition.required) !== -1) {
                if (typeof property.xml != 'undefined' && property.xml && typeof property.xml.name != 'undefined') {
                  name = property.xml.name;
                }
                if (typeof property.type != 'undefined') {
                  example[name] = buildExample(property.type, definitions, optional, typeStack);
                }
                if (typeof property.$ref != 'undefined' && property.$ref != type) {
                  example[name] = buildExample(property.$ref, definitions, optional, typeStack);
                }
                if (typeof property.items != 'undefined' && property.items.$ref != type) {
                  example[name] = [buildExample(property.items.$ref, definitions, optional, typeStack)];
                }
                if (property.example) {
                  try {
                    example[name] = JSON.parse(property.example);
                  } catch (e) {
                    example[name] = property.example;
                  }
                }
              }
            });
          }

          typeStack.pop(); // Remove the type from the stack after processing
        }
      });
    }

    return example;
  }

  function sanitize(text) {
    var value = text.replace(/[\s!@#$%^&*()_+=\[{\]};:<>|.\/?,\\'""-]/g, '-');
    value = value.replace(/((-){2,})/g, '-');
    value = value.replace(/^(-)*/g, '');
    value = value.replace(/([-])*$/g, '');
    return value;
  }

  $.get(base, function (swagger) {

    var tags = {};

    $.each(swagger.tags, function (i, tag) {
      tag.operations = [];
    });

    $.each(swagger.paths, function (path, resource) {

      $.each(resource, function (method, operation) {
        if (operation) {
          if (typeof operation.tags !== 'undefined' && $.isArray(operation.tags)) {

            $.each(operation.tags, function (i, tagName) {

                $.each(swagger.tags, function (j, tag) {

                    if (tag.name == tagName) {
                        tag.operations.push(operation);
                    }
                });
            });
          }

          operation.path = path;
          operation.method = method.toUpperCase();

          operation.label = 'default';
          if (method == 'get') {
            operation.label = 'success';
          }
          if (method == 'post') {
            operation.label = 'info';
          }
          if (method == 'put') {
            operation.label = 'warning';
          }
          if (method == 'delete') {
            operation.label = 'danger';
          }

          operation.id = sanitize(path + ' ' + operation.operationId);

          operation.queryParams = [];
          operation.pathParams = [];
          $.each(operation.parameters, function (i, parameter) {
            if (parameter.in == 'query') {
              operation.queryParams.push(parameter);
            }
            if (parameter.in == 'path') {
              operation.pathParams.push(parameter);
            }
            if (parameter.in == 'body') {
              operation.definitions = {};
              buildDefinitions(parameter.schema.$ref, swagger.definitions, operation.definitions);
              operation.example = JSON.stringify(buildExample(parameter.schema.$ref, swagger.definitions, parameter.required));
            }
          });

          $.each(operation.responses, function (code, response) {

              if (typeof response.schema != 'undefined' && response.schema && typeof response.schema.$ref != 'undefined') {
                response.definitions = {};
                buildDefinitions(response.schema.$ref, swagger.definitions, response.definitions);
                response.example = JSON.stringify(buildExample(response.schema.$ref, swagger.definitions, true), null, 2);
              }
          });
        }
      });
    });

    // render API nav
    $.each(swagger.tags, function (i, tag) {

        $('.sidebar .list-unstyled').append('<li><a href="#' + tag.name + '">' + tag.name + '</a></li>');

        $.each(tag.operations, function (i, operation) {

          $('.sidebar .list-unstyled').append('<li><a href="#' + operation.id + '"><small>&nbsp;&nbsp;&nbsp;' + operation.method + ' ' + swagger.basePath + operation.path + '</small></a></li>');

        });
    });

    // render API content
    var source = $('#api-template').html();
    var template = Handlebars.compile(source);

    var context = {swagger: swagger};
    var html = template(context);

    $('#api').html(html);
  });
});
