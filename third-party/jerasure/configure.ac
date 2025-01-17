# Jerasure autoconf template

AC_PREREQ([2.65])
AC_INIT([Jerasure], [2.0], [], [],
        [https://jerasure.org/jerasure/jerasure])
AC_CONFIG_SRCDIR([src/jerasure.c])
AC_CONFIG_HEADERS([include/config.h])

AC_CONFIG_AUX_DIR([build-aux])
AC_CONFIG_MACRO_DIR([m4])

AM_INIT_AUTOMAKE([1.13 -Wall -Wno-extra-portability])

# Package default C compiler flags.
dnl This must be before LT_INIT and AC_PROG_CC.
: ${CFLAGS='-g -O3 -Wall'}

LT_INIT([disable-static])

# Checks for programs.
AC_PROG_CC

# Checks for libraries.
AC_CHECK_LIB([gf_complete], [gf_init_easy], [],
             [AC_MSG_FAILURE(
               [You need to have gf_complete installed.
                  gf_complete is available from http://jerasure.org/jerasure/gf-complete])
             ])

# Checks for header files.
AC_CHECK_HEADERS([stddef.h stdint.h stdlib.h string.h sys/time.h unistd.h])
AC_CHECK_HEADERS([gf_complete.h gf_general.h gf_method.h gf_rand.h])

# Checks for typedefs, structures, and compiler characteristics.
AC_TYPE_UINT32_T
AC_TYPE_UINT64_T
AX_EXT

AC_ARG_ENABLE([sse],
              AS_HELP_STRING([--disable-sse], [Build without SSE optimizations]),
              [if   test "x$enableval" = "xno" ; then
                SIMD_FLAGS=""
                echo "DISABLED SSE!!!"
              fi]
)

# Checks for library functions.
AC_FUNC_MALLOC
AC_CHECK_FUNCS([bzero getcwd gettimeofday mkdir strchr strdup strrchr])

AC_CONFIG_FILES([Examples/Makefile
                 Makefile
                 src/Makefile])
AC_OUTPUT
