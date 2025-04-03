
set(HEADER_FILES
		include/chiaki/session.h
		include/chiaki/common.h
		include/chiaki/sock.h
		include/chiaki/thread.h
		include/chiaki/base64.h
		include/chiaki/http.h
		include/chiaki/log.h
		include/chiaki/ctrl.h
		include/chiaki/rpcrypt.h
		include/chiaki/takion.h
		include/chiaki/senkusha.h
		include/chiaki/streamconnection.h
		include/chiaki/ecdh.h
		include/chiaki/launchspec.h
		include/chiaki/random.h
		include/chiaki/gkcrypt.h
		include/chiaki/audio.h
		include/chiaki/audioreceiver.h
		include/chiaki/video.h
		include/chiaki/videoreceiver.h
		include/chiaki/frameprocessor.h
		include/chiaki/packetstats.h
		include/chiaki/seqnum.h
		include/chiaki/congestioncontrol.h
		include/chiaki/stoppipe.h
		include/chiaki/reorderqueue.h
		include/chiaki/feedback.h
		include/chiaki/feedbacksender.h
		include/chiaki/controller.h
		include/chiaki/takionsendbuffer.h
		include/chiaki/time.h
		include/chiaki/fec.h
		include/chiaki/regist.h
		include/chiaki/opusdecoder.h
		include/chiaki/orientation.h
		include/chiaki/bitstream.h
		include/chiaki/remote/holepunch.h
		include/chiaki/remote/rudp.h
		include/chiaki/remote/rudpsendbuffer.h)

set(SOURCE_FILES
		src/common.c
		src/sock.c
		src/session.c
		src/thread.c
		src/base64.c
		src/http.c
		src/log.c
		src/ctrl.c
		src/rpcrypt.c
		src/takion.c
		src/senkusha.c
		src/utils.h
		src/pb_utils.h
		src/streamconnection.c
		src/ecdh.c
		src/launchspec.c
		src/random.c
		src/gkcrypt.c
		src/audio.c
		src/audioreceiver.c
		src/videoreceiver.c
		src/frameprocessor.c
		src/packetstats.c
		src/congestioncontrol.c
		src/stoppipe.c
		src/reorderqueue.c
		src/feedback.c
		src/feedbacksender.c
		src/controller.c
		src/takionsendbuffer.c
		src/time.c
		src/fec.c
		src/regist.c
		src/opusdecoder.c
		src/orientation.c
		src/bitstream.c
		src/remote/holepunch.c
		src/remote/rudp.c
		src/remote/rudpsendbuffer.c)

set(CHIAKI_LIB_ENABLE_PI_DECODER "${CHIAKI_ENABLE_PI_DECODER}")

add_subdirectory(protobuf)
set_source_files_properties(${CHIAKI_LIB_PROTO_SOURCE_FILES} ${CHIAKI_LIB_PROTO_HEADER_FILES} PROPERTIES GENERATED TRUE)
include_directories("${CHIAKI_LIB_PROTO_INCLUDE_DIR}")

if(CHIAKI_LIB_ENABLE_OPUS)
	find_package(Opus REQUIRED)
	include_directories(${Opus_INCLUDE_DIRS})
endif()

add_library(chiaki-lib ${HEADER_FILES} ${SOURCE_FILES} ${CHIAKI_LIB_PROTO_SOURCE_FILES} ${CHIAKI_LIB_PROTO_HEADER_FILES})
configure_file(config.h.in include/chiaki/config.h)
target_include_directories(chiaki-lib PUBLIC "${CMAKE_CURRENT_BINARY_DIR}/include")

if(CMAKE_C_COMPILER_ID STREQUAL GNU OR CMAKE_C_COMPILER_ID STREQUAL Clang)
	target_compile_options(chiaki-lib PRIVATE -Wall)
endif()

add_dependencies(chiaki-lib chiaki-pb)
set_target_properties(chiaki-lib PROPERTIES OUTPUT_NAME chiaki)

target_include_directories(chiaki-lib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}/include")

find_package(Threads REQUIRED)
target_link_libraries(chiaki-lib Threads::Threads)

target_link_libraries(chiaki-lib CURL::libcurl_static)

# JSON-C
target_link_libraries(chiaki-lib json-c)

# miniupnpc
target_link_libraries(chiaki-lib Miniupnpc::miniupnpc)
target_include_directories(chiaki-lib PRIVATE ${CMAKE_SOURCE_DIR}/third-party/miniupnpc)

target_link_libraries(chiaki-lib OpenSSL_Crypto)

target_link_libraries(chiaki-lib Nanopb::nanopb)
target_link_libraries(chiaki-lib Jerasure::Jerasure)
