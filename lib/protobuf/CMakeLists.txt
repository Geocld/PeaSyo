
find_program(PROTOC protoc)
if(NOT PROTOC)
	message(FATAL_ERROR "Could not find protoc")
endif()

add_custom_command(OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/takion.pb"
		COMMAND "${PROTOC}" "-o${CMAKE_CURRENT_BINARY_DIR}/takion.pb" "${CMAKE_CURRENT_SOURCE_DIR}/takion.proto" "-I${CMAKE_CURRENT_SOURCE_DIR}"
		MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/takion.proto")

set(SOURCE_FILES "${CMAKE_CURRENT_BINARY_DIR}/takion.pb.c")
set(HEADER_FILES "${CMAKE_CURRENT_BINARY_DIR}/takion.pb.h")

# nanopb_generator.py 处理已生成的 .pb descriptor 时不需要 protoc，
# 直接调用即可（经 cmake -E env 透传含分号的 Windows PATH 会导致参数拆散）。
add_custom_command(OUTPUT ${SOURCE_FILES} ${HEADER_FILES}
		COMMAND "${PYTHON_EXECUTABLE}" "${NANOPB_GENERATOR_PY}" "${CMAKE_CURRENT_BINARY_DIR}/takion.pb"
		MAIN_DEPENDENCY "${CMAKE_CURRENT_BINARY_DIR}/takion.pb")

set(CHIAKI_LIB_PROTO_SOURCE_FILES "${SOURCE_FILES}" PARENT_SCOPE)
set(CHIAKI_LIB_PROTO_HEADER_FILES "${HEADER_FILES}" PARENT_SCOPE)
set(CHIAKI_LIB_PROTO_INCLUDE_DIR "${CMAKE_CURRENT_BINARY_DIR}" PARENT_SCOPE)

add_custom_target(chiaki-pb DEPENDS ${SOURCE_FILES} ${HEADER_FILES})
