
if(NOT CHIAKI_USE_SYSTEM_NANOPB)
	##################
	# nanopb
	##################

	add_definitions(-DPB_C99_STATIC_ASSERT) # Fix PB_STATIC_ASSERT on msvc without using C11 for now
	add_subdirectory(nanopb EXCLUDE_FROM_ALL)
	set(NANOPB_GENERATOR_PY "${CMAKE_CURRENT_SOURCE_DIR}/nanopb/generator/nanopb_generator.py" PARENT_SCOPE)
	add_library(nanopb INTERFACE)
	target_link_libraries(nanopb INTERFACE protobuf-nanopb-static)
	target_include_directories(nanopb INTERFACE "${CMAKE_CURRENT_SOURCE_DIR}/nanopb")
	target_compile_definitions(nanopb INTERFACE -DPB_C99_STATIC_ASSERT) # see above
	add_library(Nanopb::nanopb ALIAS nanopb)
endif()

if(NOT CHIAKI_USE_SYSTEM_JERASURE)
	##################
	# gf-complete
	##################

	set(GF_COMPLETE_SOURCE
			gf-complete/src/gf.c
			gf-complete/src/gf_wgen.c
			gf-complete/src/gf_w4.c
			gf-complete/src/gf_w8.c
			gf-complete/src/gf_w16.c
			gf-complete/src/gf_w32.c
			gf-complete/src/gf_w64.c
			gf-complete/src/gf_w128.c
			gf-complete/src/gf_rand.c
			gf-complete/src/gf_general.c
			gf-complete/src/gf_cpu.c)

	# TODO: support NEON

	add_library(gf_complete STATIC ${GF_COMPLETE_SOURCE})
	target_include_directories(gf_complete PUBLIC gf-complete/include)

	##################
	# jerasure
	##################

	set(JERASURE_SOURCE
			jerasure/src/galois.c
			jerasure/src/jerasure.c
			jerasure/src/reed_sol.c
			jerasure/src/cauchy.c
			jerasure/src/liberation.c)

	add_library(jerasure STATIC ${JERASURE_SOURCE})
	target_include_directories(jerasure PUBLIC jerasure/include)
	target_link_libraries(jerasure gf_complete)

	add_library(Jerasure::Jerasure ALIAS jerasure)
endif()

if(NOT CHIAKI_USE_SYSTEM_CURL) 
	##################
	# libcurl (with experimental WebSocket support enabled)
	##################
	set(BUILD_EXE OFF)
	set(BUILD_SHARED_LIBS OFF)
	set(BUILD_STATIC_LIBS ON)
	set(CURL_DISABLE_INSTALL ON)
	set(HTTP_ONLY ON)
	set(ENABLE_WEBSOCKETS ON)
	set(CURL_USE_OPENSSL OFF)

	find_package(PkgConfig QUIET)
	if (PKG_CONFIG_FOUND)
		pkg_check_modules(PkgLibIdn2 IMPORTED_TARGET GLOBAL libidn2)
	endif ()

	if (PkgLibIdn2_FOUND)
		set(LIBIDN2_INCLUDE_DIR ${PkgLibIdn2_INCLUDE_DIRS} CACHE FILEPATH "libidn2 include path")
		set(LIBIDN2_LIBRARIES ${PkgLibIdn2_LIBRARIES} CACHE STRING "libidn2 libraries")
		set(LIBIDN2_VERSION ${PkgLibIdn2_VERSION})
		add_library(Libidn2::Libidn2 ALIAS PkgConfig::PkgLibIdn2)
		set(Libidn2_FOUND ON)
	endif()
	add_subdirectory(curl)
	# Exported library is CURL::libcurl_static
	
endif()

# JSON-C
add_subdirectory(json-c)

if(NOT CHIAKI_USE_SYSTEM_MINIUPNPC)
    set(UPNPC_BUILD_STATIC ON CACHE BOOL "Build static library" FORCE)
    set(UPNPC_BUILD_SHARED OFF CACHE BOOL "Build shared library" FORCE)
    set(UPNPC_BUILD_TESTS OFF CACHE BOOL "Build test executables" FORCE)
    add_subdirectory(miniupnpc)
    add_library(Miniupnpc::miniupnpc ALIAS libminiupnpc-static)
endif()
