$(function () {

	var base = WORLDSKILLS_API_DOCS;
	
	function findModels(type, all, models) {

		if (typeof all != 'undefined') {

			$.each(all, function (name, model) {

				if (name == type) {

					models[name] = model;

					$.each(model.properties, function (name, property) {
						if ($.inArray(name, model.required) !== -1) {
							property.required = true;
						} else {
							property.required = false;
						}
						if (typeof property.$ref != 'undefined') {
							models = findModels(property.$ref, all, models);
						}
						if (typeof property.items != 'undefined') {
							models = findModels(property.items.$ref, all, models);
						}
					});
				}
			});
		}

		return models;
	}

	function buildExample(type, models, optional) {

		if (type == 'string') {
			return '';
		}

		if (type == 'boolean') {
			return false;
		}

		if (type == 'integer') {
			return 0;
		}

		if (type == 'double' || type == 'number') {
			return 0.0;
		}

		if (type == 'array') {
			return [];
		}

		var example = {};

		if (typeof models != 'undefined') {

			$.each(models, function (name, model) {

				if (name == type) {

					$.each(model.properties, function (name, property) {

						if (optional || $.inArray(name, model.required) !== -1) {
							if (typeof property.type != 'undefined') {
								example[name] = buildExample(property.type, models, optional);						
							}
							if (typeof property.$ref != 'undefined') {
								example[name] = buildExample(property.$ref, models, optional);
							}
							if (typeof property.items != 'undefined') {
								example[name].push(buildExample(property.items.$ref, models, optional));
							}
						}
					});
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
	
	$.get(base, function (json) {

		var apis = [];

		var requests = [];
		$.each(json.apis, function (i, api) {

			api.id = sanitize(api.path);

			requests.push($.get(base + api.path, function (apiJson) {

				api.api = apiJson;

				$.each(apiJson.apis, function (i, resource) {

					$.each(resource.operations, function (i, operation) {

						operation.label = 'default';
						if (operation.method == 'GET') {
							operation.label = 'success';
						}
						if (operation.method == 'POST') {
							operation.label = 'info';
						}
						if (operation.method == 'PUT') {
							operation.label = 'warning';
						}
						if (operation.method == 'DELETE') {
							operation.label = 'danger';
						}
						
						operation.id = sanitize(api.api.resourcePath + ' ' + operation.nickname);

						if (operation.type != 'void') {

							operation.models = findModels(operation.type, apiJson.models, {});

							operation.example = JSON.stringify(buildExample(operation.type, apiJson.models, true), null, 4);
						}

						operation.queryParams = [];
						operation.pathParams = [];
						operation.requestModels = [];
						$.each(operation.parameters, function (i, parameter) {
							if (parameter.paramType == 'query') {
								operation.queryParams.push(parameter);
							}
							if (parameter.paramType == 'path') {
								operation.pathParams.push(parameter);
							}
							if (parameter.paramType == 'body') {
								operation.requestModels = findModels(parameter.type, apiJson.models, {});
								operation.requestExample = JSON.stringify(buildExample(parameter.type, apiJson.models, false));
							}
						});
					});
				});
			}));

			apis.push(api);
		});

		$.when.apply($, requests).done(function () {

			console.log(apis);

			// render API nav
			$.each(apis, function (i, api) {

				$('.sidebar .nav').append('<li><a href="#' + api.id + '">' + api.description + '</a></li>');

				$.each(api.api.apis, function (i, resource) {

					$.each(resource.operations, function (i, operation) {

						$('.sidebar .nav').append('<li><a href="#' + operation.id + '"><small>&nbsp;&nbsp;&nbsp;' + operation.method + ' ' + api.api.resourcePath + resource.path + '</small></a></li>');
					});
				});
			});

			// render API content
			var source = $('#api-template').html();
			var template = Handlebars.compile(source);

			var context = {apis: apis};
			var html = template(context);

			$('#api').html(html);
		});
	});
	
	
});
